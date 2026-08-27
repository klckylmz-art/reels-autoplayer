package com.yilmaz.reelsplayer

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.yilmaz.reelsplayer.media.MediaCatalog
import com.yilmaz.reelsplayer.playback.PlayMode
import com.yilmaz.reelsplayer.playback.PlayerViewModel
import com.yilmaz.reelsplayer.ui.HomeScreen
import com.yilmaz.reelsplayer.ui.PlayerScreen
import com.yilmaz.reelsplayer.ui.theme.ReelsPlayerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val catalog = MediaCatalog(assets)
        val playerViewModel = PlayerViewModel(catalog::load)

        setContent {
            ReelsPlayerTheme {
                ReelsApp(
                    viewModel = playerViewModel,
                    mediaCount = remember { catalog.load().size },
                    setPlayerSystemUi = ::setPlayerSystemUi
                )
            }
        }
    }

    private fun setPlayerSystemUi(enabled: Boolean) {
        val controller = WindowCompat.getInsetsController(window, window.decorView)
        if (enabled) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            controller.systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            controller.hide(WindowInsetsCompat.Type.systemBars())
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            controller.show(WindowInsetsCompat.Type.systemBars())
        }
    }
}

@Composable
private fun ReelsApp(
    viewModel: PlayerViewModel,
    mediaCount: Int,
    setPlayerSystemUi: (Boolean) -> Unit
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(state.homeVisible) {
        setPlayerSystemUi(!state.homeVisible)
    }

    BackHandler(enabled = !state.homeVisible) {
        viewModel.returnHome()
    }

    if (state.homeVisible) {
        HomeScreen(
            mediaCount = mediaCount,
            errorMessage = state.errorMessage,
            onSequential = { viewModel.start(PlayMode.SEQUENTIAL) },
            onShuffled = { viewModel.start(PlayMode.SHUFFLED) }
        )
    } else {
        PlayerScreen(
            state = state,
            onTogglePause = viewModel::togglePause,
            onNext = viewModel::next,
            onPrevious = viewModel::previous,
            onComplete = viewModel::next,
            onFailure = viewModel::itemFailed,
            onReturnHome = viewModel::returnHome
        )
    }
}
