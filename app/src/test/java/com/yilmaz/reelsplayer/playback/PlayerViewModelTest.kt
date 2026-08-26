package com.yilmaz.reelsplayer.playback

import com.yilmaz.reelsplayer.media.MediaAsset
import com.yilmaz.reelsplayer.media.MediaKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PlayerViewModelTest {
    private val items = listOf(
        MediaAsset("1.mp4", MediaKind.VIDEO),
        MediaAsset("2.webp", MediaKind.WEBP)
    )

    @Test
    fun startAndFinishExposeCorrectUiState() {
        val viewModel = PlayerViewModel { items }

        viewModel.start(PlayMode.SEQUENTIAL)
        assertEquals("1.mp4", viewModel.state.value.current?.fileName)
        viewModel.next()
        viewModel.next()

        assertTrue(viewModel.state.value.finished)
        assertNull(viewModel.state.value.current)
    }

    @Test
    fun failedItemIsReportedAndSkipped() {
        val viewModel = PlayerViewModel { items }

        viewModel.start(PlayMode.SEQUENTIAL)
        viewModel.itemFailed("1.mp4")

        assertEquals("2.webp", viewModel.state.value.current?.fileName)
        assertTrue(viewModel.state.value.errorMessage.orEmpty().contains("1.mp4"))
    }

    @Test
    fun emptyCatalogReportsAnError() {
        val viewModel = PlayerViewModel { emptyList() }

        viewModel.start(PlayMode.SEQUENTIAL)

        assertTrue(viewModel.state.value.finished)
        assertTrue(viewModel.state.value.errorMessage.orEmpty().isNotBlank())
    }
}
