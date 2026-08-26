package com.yilmaz.reelsplayer.playback

import com.yilmaz.reelsplayer.media.MediaAsset
import com.yilmaz.reelsplayer.media.MediaKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PlaylistControllerTest {
    private val items = listOf(
        MediaAsset("1.mp4", MediaKind.VIDEO),
        MediaAsset("2.mp4", MediaKind.VIDEO),
        MediaAsset("3.webp", MediaKind.WEBP)
    )

    @Test
    fun sequentialStopsAfterFinalItem() {
        val subject = PlaylistController(items, PlayMode.SEQUENTIAL)

        assertEquals("1.mp4", subject.current?.fileName)
        assertEquals("2.mp4", subject.advance()?.fileName)
        assertEquals("3.webp", subject.advance()?.fileName)
        assertNull(subject.advance())
        assertTrue(subject.isFinished)
    }

    @Test
    fun previousNeverWrapsBeforeFirstItem() {
        val subject = PlaylistController(items, PlayMode.SEQUENTIAL)

        assertEquals("1.mp4", subject.previous()?.fileName)
    }

    @Test
    fun shuffleIsAppliedOnlyAtConstruction() {
        var calls = 0
        val subject = PlaylistController(items, PlayMode.SHUFFLED) { source ->
            calls += 1
            source.reversed()
        }

        assertEquals("3.webp", subject.current?.fileName)
        subject.advance()
        subject.previous()
        assertEquals(1, calls)
    }
}
