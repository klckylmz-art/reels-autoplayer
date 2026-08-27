package com.yilmaz.reelsplayer.ui

import android.net.Uri
import androidx.annotation.OptIn
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.yilmaz.reelsplayer.media.MediaAsset

@OptIn(UnstableApi::class)
@Composable
fun VideoPage(
    asset: MediaAsset,
    paused: Boolean,
    onComplete: () -> Unit,
    onFailure: () -> Unit
) {
    val context = LocalContext.current
    val player = remember(asset.fileName) {
        ExoPlayer.Builder(context).build().apply {
            val encodedName = Uri.encode(asset.fileName, null)
            setMediaItem(MediaItem.fromUri("asset:///media/$encodedName"))
            prepare()
            playWhenReady = true
        }
    }

    LaunchedEffect(player, paused) {
        player.playWhenReady = !paused
    }

    DisposableEffect(player, onComplete, onFailure) {
        val listener = object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState == Player.STATE_ENDED) onComplete()
            }

            override fun onPlayerError(error: PlaybackException) {
                onFailure()
            }
        }
        player.addListener(listener)
        onDispose {
            player.removeListener(listener)
            player.release()
        }
    }

    AndroidView(
        factory = { viewContext ->
            PlayerView(viewContext).apply {
                useController = false
                resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                this.player = player
            }
        },
        update = { it.player = player },
        modifier = Modifier.fillMaxSize()
    )
}
