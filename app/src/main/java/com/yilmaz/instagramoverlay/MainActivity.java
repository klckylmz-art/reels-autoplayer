package com.yilmaz.instagramoverlay;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class MainActivity extends Activity {

    private static final String INSTAGRAM_HOME = "https://www.instagram.com/";

    private WebView webView;
    private TextView statusText;
    private Button btnAuto;
    private Button btnLoop;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final List<String> reelQueue = new ArrayList<>();
    private final Set<String> collectedDuringScan = new LinkedHashSet<>();

    private int reelIndex = 0;
    private boolean autoNext = true;
    private boolean loop = true;
    private long lastAutomaticAdvance = 0L;
    private boolean scanRunning = false;

    private SharedPreferences prefs;

    private final Runnable videoWatcher = new Runnable() {
        @Override
        public void run() {
            if (autoNext && isReelUrl(webView.getUrl()) && !reelQueue.isEmpty()) {
                String js = "(function(){" +
                        "const vs=[...document.querySelectorAll('video')];" +
                        "if(!vs.length)return 'NONE';" +
                        "const visible=vs.filter(v=>{const r=v.getBoundingClientRect();return r.width>80&&r.height>80&&r.bottom>0&&r.top<innerHeight;});" +
                        "const list=visible.length?visible:vs;" +
                        "const v=list.sort((a,b)=>(b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight))[0];" +
                        "if(!v)return 'NONE';" +
                        "if(v.ended)return 'ENDED';" +
                        "if(isFinite(v.duration)&&v.duration>1&&v.currentTime>=v.duration-0.35)return 'ENDED';" +
                        "return 'PLAYING';" +
                        "})()";

                webView.evaluateJavascript(js, value -> {
                    String result = unquote(value);
                    long now = System.currentTimeMillis();
                    if ("ENDED".equals(result) && now - lastAutomaticAdvance > 2500) {
                        lastAutomaticAdvance = now;
                        nextReel();
                    }
                });
            }
            handler.postDelayed(this, 900);
        }
    };

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = getSharedPreferences("reels_player", MODE_PRIVATE);
        loadQueue();

        webView = findViewById(R.id.webView);
        statusText = findViewById(R.id.statusText);
        btnAuto = findViewById(R.id.btnAuto);
        btnLoop = findViewById(R.id.btnLoop);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if (host != null && (host.equals("instagram.com") || host.endsWith(".instagram.com"))) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) { }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                syncIndex(url);
                updateStatus();
            }
        });

        findViewById(R.id.btnCollect).setOnClickListener(v -> startCollection());
        findViewById(R.id.btnPrev).setOnClickListener(v -> previousReel());
        findViewById(R.id.btnNext).setOnClickListener(v -> nextReel());
        findViewById(R.id.btnPlayPause).setOnClickListener(v -> togglePlayPause());
        findViewById(R.id.btnInstagramHome).setOnClickListener(v -> webView.loadUrl(INSTAGRAM_HOME));

        btnAuto.setOnClickListener(v -> {
            autoNext = !autoNext;
            btnAuto.setText(autoNext ? "AUTO: AÇIK" : "AUTO: KAPALI");
            Toast.makeText(this, autoNext ? "Otomatik geçiş açık" : "Otomatik geçiş kapalı", Toast.LENGTH_SHORT).show();
        });

        btnLoop.setOnClickListener(v -> {
            loop = !loop;
            btnLoop.setText(loop ? "LOOP: AÇIK" : "LOOP: KAPALI");
        });

        webView.loadUrl(INSTAGRAM_HOME);
        handler.post(videoWatcher);
    }

    private void startCollection() {
        if (scanRunning) {
            Toast.makeText(this, "Tarama zaten devam ediyor.", Toast.LENGTH_SHORT).show();
            return;
        }
        scanRunning = true;
        collectedDuringScan.clear();
        statusText.setText("Reels taranıyor… Profilin Reels sekmesinde kal.");
        collectRound(0, 20);
    }

    private void collectRound(int round, int maxRounds) {
        String harvestJs = "(function(){" +
                "const out=new Set();" +
                "const add=(s)=>{if(!s)return;try{s=String(s).replace(/\\\\\//g,'/');const re=/\\/(?:reel|reels)\\/([A-Za-z0-9_-]{5,})/g;let m;while((m=re.exec(s))!==null){out.add('https://www.instagram.com/reel/'+m[1]+'/');}}catch(e){}};" +
                "document.querySelectorAll('[href]').forEach(el=>add(el.getAttribute('href')));" +
                "add(document.documentElement.outerHTML);" +
                "document.querySelectorAll('script').forEach(s=>add(s.textContent));" +
                "return [...out];" +
                "})()";

        webView.evaluateJavascript(harvestJs, value -> {
            try {
                JSONArray arr = new JSONArray(value);
                for (int i = 0; i < arr.length(); i++) {
                    collectedDuringScan.add(arr.getString(i));
                }
            } catch (Exception ignored) { }

            statusText.setText("Reels taranıyor… " + collectedDuringScan.size() + " bulundu");

            if (round >= maxRounds - 1) {
                finishCollection();
                return;
            }

            String scrollJs = "(function(){" +
                    "window.scrollBy(0,Math.max(innerHeight*0.85,600));" +
                    "const els=[...document.querySelectorAll('*')].filter(e=>e.scrollHeight>e.clientHeight+200);" +
                    "els.sort((a,b)=>(b.clientHeight*b.clientWidth)-(a.clientHeight*a.clientWidth));" +
                    "for(const e of els.slice(0,5)){try{e.scrollTop=Math.min(e.scrollHeight,e.scrollTop+Math.max(e.clientHeight*0.85,600));}catch(x){}}" +
                    "return true;" +
                    "})()";
            webView.evaluateJavascript(scrollJs, null);
            handler.postDelayed(() -> collectRound(round + 1, maxRounds), 900);
        });
    }

    private void finishCollection() {
        scanRunning = false;
        webView.evaluateJavascript("window.scrollTo(0,0); true;", null);

        if (collectedDuringScan.isEmpty()) {
            statusText.setText("Reel bulunamadı. Profilin Reels sekmesini açıp tekrar dene.");
            Toast.makeText(this, "Reel bulunamadı", Toast.LENGTH_LONG).show();
            return;
        }

        reelQueue.clear();
        reelQueue.addAll(collectedDuringScan);
        reelIndex = 0;
        saveQueue();
        updateStatus();
        loadCurrentReel();
    }

    private void togglePlayPause() {
        String js = "(function(){" +
                "const vs=[...document.querySelectorAll('video')];" +
                "if(!vs.length)return 'NO_VIDEO';" +
                "const visible=vs.filter(v=>{const r=v.getBoundingClientRect();return r.width>80&&r.height>80&&r.bottom>0&&r.top<innerHeight;});" +
                "const list=visible.length?visible:vs;" +
                "const v=list.sort((a,b)=>(b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight))[0];" +
                "if(v.paused){v.play();return 'PLAY';}else{v.pause();return 'PAUSE';}" +
                "})()";
        webView.evaluateJavascript(js, value -> {
            if ("NO_VIDEO".equals(unquote(value))) {
                Toast.makeText(this, "Aktif video bulunamadı.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void nextReel() {
        if (reelQueue.isEmpty()) {
            Toast.makeText(this, "Önce Reels Topla.", Toast.LENGTH_SHORT).show();
            return;
        }
        if (reelIndex < reelQueue.size() - 1) {
            reelIndex++;
        } else if (loop) {
            reelIndex = 0;
        } else {
            autoNext = false;
            btnAuto.setText("AUTO: KAPALI");
            Toast.makeText(this, "Listenin sonu", Toast.LENGTH_SHORT).show();
            return;
        }
        saveQueue();
        loadCurrentReel();
    }

    private void previousReel() {
        if (reelQueue.isEmpty()) {
            Toast.makeText(this, "Önce Reels Topla.", Toast.LENGTH_SHORT).show();
            return;
        }
        if (reelIndex > 0) {
            reelIndex--;
        } else if (loop) {
            reelIndex = reelQueue.size() - 1;
        }
        saveQueue();
        loadCurrentReel();
    }

    private void loadCurrentReel() {
        if (reelQueue.isEmpty()) return;
        reelIndex = Math.max(0, Math.min(reelIndex, reelQueue.size() - 1));
        statusText.setText("Reel " + (reelIndex + 1) + " / " + reelQueue.size());
        webView.loadUrl(reelQueue.get(reelIndex));
    }

    private void syncIndex(String url) {
        String normalized = normalizeReel(url);
        if (normalized == null) return;
        int found = reelQueue.indexOf(normalized);
        if (found >= 0) {
            reelIndex = found;
            saveQueue();
        }
    }

    private void updateStatus() {
        if (!reelQueue.isEmpty() && isReelUrl(webView.getUrl())) {
            statusText.setText("Reel " + (reelIndex + 1) + " / " + reelQueue.size());
        } else if (reelQueue.isEmpty()) {
            statusText.setText("Instagram'da bir profilin Reels sekmesini aç → REELS TOPLA");
        } else {
            statusText.setText(reelQueue.size() + " Reel kayıtlı · Reels Topla ile listeyi yenileyebilirsin");
        }
    }

    private boolean isReelUrl(String url) {
        return normalizeReel(url) != null;
    }

    private String normalizeReel(String url) {
        if (url == null) return null;
        int p = url.indexOf("/reel/");
        int prefixLength = 6;
        if (p < 0) {
            p = url.indexOf("/reels/");
            prefixLength = 7;
        }
        if (p < 0) return null;
        int start = p + prefixLength;
        int end = url.indexOf('/', start);
        if (end < 0) end = url.length();
        if (end <= start) return null;
        return "https://www.instagram.com/reel/" + url.substring(start, end) + "/";
    }

    private String unquote(String value) {
        if (value == null) return "";
        if (value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }

    private void saveQueue() {
        JSONArray arr = new JSONArray();
        for (String url : reelQueue) arr.put(url);
        prefs.edit()
                .putString("queue", arr.toString())
                .putInt("index", reelIndex)
                .apply();
    }

    private void loadQueue() {
        reelQueue.clear();
        String saved = prefs.getString("queue", "[]");
        try {
            JSONArray arr = new JSONArray(saved);
            for (int i = 0; i < arr.length(); i++) reelQueue.add(arr.getString(i));
        } catch (Exception ignored) { }
        reelIndex = prefs.getInt("index", 0);
        if (reelIndex >= reelQueue.size()) reelIndex = 0;
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
