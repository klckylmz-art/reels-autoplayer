package com.yilmaz.reelsplayer.ui

import android.graphics.ImageDecoder
import android.graphics.drawable.Animatable2
import android.graphics.drawable.AnimatedImageDrawable
import android.graphics.drawable.Drawable
import android.widget.ImageView
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.yilmaz.reelsplayer.media.MediaAsset
import kotlinx.coroutines.delay

private const val STATIC_WEBP_DURATION_MS = 5_000L
private const val TIMER_STEP_MS = 50L

@Composable
fun WebpPage(
    asset: MediaAsset,
    paused: Boolean,
    onComplete: () -> Unit,
    onFailure: () -> Unit
) {
    val context = LocalContext.current
    val decoded = remember(asset.fileName) {
        runCatching {
            val source = ImageDecoder.createSource(
                context.assets,
                "media/${asset.fileName}"
            )
            ImageDecoder.decodeDrawable(source)
        }
    }
    val drawable: Drawable? = decoded.getOrNull()

    LaunchedEffect(decoded) {
        if (decoded.isFailure) onFailure()
    }

    AndroidView(
        factory = { imageContext ->
            ImageView(imageContext).apply {
                scaleType = ImageView.ScaleType.FIT_CENTER
                setImageDrawable(drawable)
            }
        },
        update = { it.setImageDrawable(drawable) },
        modifier = Modifier.fillMaxSize()
    )

    if (drawable is AnimatedImageDrawable) {
        AnimatedWebpEffect(
            drawable = drawable,
            paused = paused,
            onComplete = onComplete
        )
    } else if (drawable != null) {
        StaticWebpTimer(paused = paused, onComplete = onComplete)
    }
}

@Composable
private fun AnimatedWebpEffect(
    drawable: AnimatedImageDrawable,
    paused: Boolean,
    onComplete: () -> Unit
) {
    DisposableEffect(drawable, onComplete) {
        drawable.repeatCount = 0
        val callback = object : Animatable2.AnimationCallback() {
            override fun onAnimationEnd(animatedDrawable: Drawable?) {
                onComplete()
            }
        }
        drawable.registerAnimationCallback(callback)
        onDispose {
            drawable.unregisterAnimationCallback(callback)
            drawable.stop()
        }
    }

    LaunchedEffect(drawable, paused) {
        if (paused) drawable.stop() else drawable.start()
    }
}

@Composable
private fun StaticWebpTimer(paused: Boolean, onComplete: () -> Unit) {
    var remainingMs by remember { mutableLongStateOf(STATIC_WEBP_DURATION_MS) }

    LaunchedEffect(paused) {
        while (remainingMs > 0L) {
            if (paused) {
                delay(TIMER_STEP_MS)
            } else {
                val step = minOf(TIMER_STEP_MS, remainingMs)
                delay(step)
                remainingMs -= step
            }
        }
        onComplete()
    }
}
