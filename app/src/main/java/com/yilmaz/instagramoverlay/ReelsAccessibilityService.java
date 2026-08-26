package com.yilmaz.instagramoverlay;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Color;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public class ReelsAccessibilityService extends AccessibilityService {

    private WindowManager windowManager;
    private LinearLayout overlay;
    private TextView timerText;
    private Button autoButton;
    private final Handler handler = new Handler(Looper.getMainLooper());

    private boolean autoEnabled = false;
    private int intervalSeconds = 30;

    private final Runnable autoRunnable = new Runnable() {
        @Override
        public void run() {
            if (!autoEnabled) return;
            swipeUp();
            handler.postDelayed(this, intervalSeconds * 1000L);
        }
    };

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        showOverlay();
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Service is intentionally limited to Instagram via accessibility config.
    }

    @Override
    public void onInterrupt() { }

    private GradientDrawable rounded(int color, float radius) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(radius);
        return d;
    }

    private Button makeButton(String text) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextColor(Color.WHITE);
        b.setTextSize(12f);
        b.setAllCaps(false);
        b.setBackground(rounded(Color.rgb(35,35,40), 24f));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(46), 1f);
        lp.setMargins(dp(3), 0, dp(3), 0);
        b.setLayoutParams(lp);
        return b;
    }

    private void showOverlay() {
        if (overlay != null) return;

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

        overlay = new LinearLayout(this);
        overlay.setOrientation(LinearLayout.VERTICAL);
        overlay.setPadding(dp(7), dp(7), dp(7), dp(7));
        overlay.setBackground(rounded(Color.argb(225, 12, 12, 15), 30f));

        LinearLayout row1 = new LinearLayout(this);
        row1.setOrientation(LinearLayout.HORIZONTAL);

        Button prev = makeButton("◀");
        Button play = makeButton("Play/Pause");
        Button next = makeButton("▶");
        row1.addView(prev);
        row1.addView(play);
        row1.addView(next);

        LinearLayout row2 = new LinearLayout(this);
        row2.setOrientation(LinearLayout.HORIZONTAL);

        autoButton = makeButton("AUTO: Kapalı");
        Button minus = makeButton("−5 sn");
        Button plus = makeButton("+5 sn");
        row2.addView(autoButton);
        row2.addView(minus);
        row2.addView(plus);

        timerText = new TextView(this);
        timerText.setTextColor(Color.LTGRAY);
        timerText.setTextSize(11f);
        timerText.setGravity(Gravity.CENTER);
        timerText.setPadding(0, dp(4), 0, 0);
        updateTimerText();

        overlay.addView(row1);
        overlay.addView(row2);
        overlay.addView(timerText);

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                dp(300),
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.END;
        params.x = dp(8);
        params.y = dp(120);

        attachDrag(overlay, params);
        windowManager.addView(overlay, params);

        prev.setOnClickListener(v -> swipeDown());
        next.setOnClickListener(v -> swipeUp());
        play.setOnClickListener(v -> tapCenter());

        autoButton.setOnClickListener(v -> {
            autoEnabled = !autoEnabled;
            autoButton.setText(autoEnabled ? "AUTO: Açık" : "AUTO: Kapalı");
            handler.removeCallbacks(autoRunnable);
            if (autoEnabled) handler.postDelayed(autoRunnable, intervalSeconds * 1000L);
        });

        minus.setOnClickListener(v -> {
            intervalSeconds = Math.max(5, intervalSeconds - 5);
            rescheduleAuto();
            updateTimerText();
        });

        plus.setOnClickListener(v -> {
            intervalSeconds = Math.min(180, intervalSeconds + 5);
            rescheduleAuto();
            updateTimerText();
        });
    }

    private void attachDrag(View view, WindowManager.LayoutParams params) {
        view.setOnTouchListener(new View.OnTouchListener() {
            float downX, downY;
            int startX, startY;
            boolean moving;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        downX = event.getRawX();
                        downY = event.getRawY();
                        startX = params.x;
                        startY = params.y;
                        moving = false;
                        return false;
                    case MotionEvent.ACTION_MOVE:
                        float dx = event.getRawX() - downX;
                        float dy = event.getRawY() - downY;
                        if (Math.abs(dx) > dp(8) || Math.abs(dy) > dp(8)) {
                            moving = true;
                            params.x = startX - (int) dx;
                            params.y = startY + (int) dy;
                            if (windowManager != null && overlay != null) {
                                windowManager.updateViewLayout(overlay, params);
                            }
                            return true;
                        }
                        return false;
                }
                return moving;
            }
        });
    }

    private void rescheduleAuto() {
        if (!autoEnabled) return;
        handler.removeCallbacks(autoRunnable);
        handler.postDelayed(autoRunnable, intervalSeconds * 1000L);
    }

    private void updateTimerText() {
        if (timerText != null) timerText.setText("Otomatik geçiş: " + intervalSeconds + " saniye");
    }

    private void swipeUp() {
        performSwipe(0.78f, 0.28f);
    }

    private void swipeDown() {
        performSwipe(0.28f, 0.78f);
    }

    private void performSwipe(float startYRatio, float endYRatio) {
        int width = getResources().getDisplayMetrics().widthPixels;
        int height = getResources().getDisplayMetrics().heightPixels;
        float x = width * 0.5f;
        float y1 = height * startYRatio;
        float y2 = height * endYRatio;

        Path path = new Path();
        path.moveTo(x, y1);
        path.lineTo(x, y2);

        GestureDescription.StrokeDescription stroke =
                new GestureDescription.StrokeDescription(path, 0, 300);

        dispatchGesture(new GestureDescription.Builder()
                .addStroke(stroke)
                .build(), null, null);
    }

    private void tapCenter() {
        int width = getResources().getDisplayMetrics().widthPixels;
        int height = getResources().getDisplayMetrics().heightPixels;

        Path path = new Path();
        path.moveTo(width * 0.5f, height * 0.5f);

        GestureDescription.StrokeDescription stroke =
                new GestureDescription.StrokeDescription(path, 0, 80);

        dispatchGesture(new GestureDescription.Builder()
                .addStroke(stroke)
                .build(), null, null);
    }

    private int dp(int value) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(value * density);
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(autoRunnable);
        if (windowManager != null && overlay != null) {
            try { windowManager.removeView(overlay); } catch (Exception ignored) {}
        }
        overlay = null;
        super.onDestroy();
    }
}
