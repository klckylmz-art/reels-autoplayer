package com.yilmaz.reelsplayer.playback

import androidx.lifecycle.ViewModel
import com.yilmaz.reelsplayer.media.MediaAsset
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class PlayerUiState(
    val homeVisible: Boolean = true,
    val current: MediaAsset? = null,
    val paused: Boolean = false,
    val finished: Boolean = false,
    val errorMessage: String? = null
)

class PlayerViewModel(
    private val loadMedia: () -> List<MediaAsset>
) : ViewModel() {
    private var playlist: PlaylistController? = null
    private val mutableState = MutableStateFlow(PlayerUiState())

    val state: StateFlow<PlayerUiState> = mutableState.asStateFlow()

    fun start(mode: PlayMode) {
        playlist = PlaylistController(loadMedia(), mode)
        val current = playlist?.current
        mutableState.value = PlayerUiState(
            homeVisible = current == null,
            current = current,
            finished = current == null,
            errorMessage = if (current == null) "Geçerli medya bulunamadı." else null
        )
    }

    fun next() {
        show(playlist?.advance())
    }

    fun previous() {
        show(playlist?.previous())
    }

    fun togglePause() {
        mutableState.update { it.copy(paused = !it.paused) }
    }

    fun itemFailed(fileName: String) {
        mutableState.update { it.copy(errorMessage = "$fileName atlandı.") }
        next()
    }

    fun clearError() {
        mutableState.update { it.copy(errorMessage = null) }
    }

    fun returnHome() {
        playlist = null
        mutableState.value = PlayerUiState()
    }

    private fun show(item: MediaAsset?) {
        mutableState.update {
            it.copy(
                homeVisible = false,
                current = item,
                paused = false,
                finished = item == null
            )
        }
    }
}
