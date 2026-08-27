package com.yilmaz.reelsplayer.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import com.yilmaz.reelsplayer.media.MediaKind
import com.yilmaz.reelsplayer.playback.PlayerUiState
import kotlin.math.abs

@Composable
fun PlayerScreen(
    state: PlayerUiState,
    onTogglePause: () -> Unit,
    onNext: () -> Unit,
    onPrevious: () -> Unit,
    onComplete: () -> Unit,
    onFailure: (String) -> Unit,
    onReturnHome: () -> Unit
) {
    if (state.finished || state.current == null) {
        FinishedScreen(onReturnHome)
        return
    }

    val current = state.current
    var horizontalDrag by remember(current.fileName) { mutableFloatStateOf(0f) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .pointerInput(current.fileName) {
                detectTapGestures(onTap = { onTogglePause() })
            }
            .pointerInput(current.fileName) {
                detectHorizontalDragGestures(
                    onDragStart = { horizontalDrag = 0f },
                    onHorizontalDrag = { change, amount ->
                        change.consume()
                        horizontalDrag += amount
                    },
                    onDragEnd = {
                        if (abs(horizontalDrag) >= 120f) {
                            if (horizontalDrag < 0f) onNext() else onPrevious()
                        }
                        horizontalDrag = 0f
                    },
                    onDragCancel = { horizontalDrag = 0f }
                )
            }
    ) {
        when (current.kind) {
            MediaKind.VIDEO -> VideoPage(
                asset = current,
                paused = state.paused,
                onComplete = onComplete,
                onFailure = { onFailure(current.fileName) }
            )

            MediaKind.WEBP -> WebpPage(
                asset = current,
                paused = state.paused,
                onComplete = onComplete,
                onFailure = { onFailure(current.fileName) }
            )
        }

        IconButton(
            onClick = onReturnHome,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 26.dp, end = 12.dp)
        ) {
            Text(
                text = "×",
                color = Color.White,
                style = MaterialTheme.typography.headlineMedium
            )
        }

        if (state.paused) {
            Text(
                text = "Duraklatıldı",
                color = Color.White,
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier
                    .align(Alignment.Center)
                    .background(Color(0x99000000), MaterialTheme.shapes.medium)
                    .padding(horizontal = 18.dp, vertical = 10.dp)
            )
        }

        state.errorMessage?.let { message ->
            Text(
                text = message,
                color = Color.White,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(24.dp)
                    .background(Color(0xAA8B0000), MaterialTheme.shapes.small)
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            )
        }
    }
}

@Composable
private fun FinishedScreen(onReturnHome: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "Oynatma tamamlandı",
                color = Color.White,
                style = MaterialTheme.typography.headlineSmall
            )
            Spacer(Modifier.height(22.dp))
            Button(onClick = onReturnHome) {
                Text("Ana Ekrana Dön")
            }
        }
    }
}
