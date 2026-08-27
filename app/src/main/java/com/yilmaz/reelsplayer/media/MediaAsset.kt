package com.yilmaz.reelsplayer.media

enum class MediaKind {
    VIDEO,
    WEBP
}

data class MediaAsset(
    val fileName: String,
    val kind: MediaKind
)
