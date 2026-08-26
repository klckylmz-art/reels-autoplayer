package com.yilmaz.reelsplayer.media

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MediaCatalogTest {
    @Test
    fun loadsSupportedFilesInNaturalOrder() {
        val catalog = MediaCatalog { arrayOf("10.mp4", "2.mp4", "note.txt", "1.webp") }

        assertEquals(
            listOf("1.webp", "2.mp4", "10.mp4"),
            catalog.load().map { it.fileName }
        )
    }

    @Test
    fun detectsVideoAndWebpKindsCaseInsensitively() {
        val catalog = MediaCatalog { arrayOf("A.WEBP", "B.MP4", "C.webm") }

        assertEquals(
            listOf(MediaKind.WEBP, MediaKind.VIDEO, MediaKind.VIDEO),
            catalog.load().map { it.kind }
        )
    }

    @Test
    fun returnsEmptyListWhenAssetsCannotBeListed() {
        assertTrue(MediaCatalog { null }.load().isEmpty())
    }
}
