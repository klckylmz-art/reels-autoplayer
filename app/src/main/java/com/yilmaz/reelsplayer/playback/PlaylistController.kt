package com.yilmaz.reelsplayer.playback

import com.yilmaz.reelsplayer.media.MediaAsset

enum class PlayMode {
    SEQUENTIAL,
    SHUFFLED
}

class PlaylistController(
    source: List<MediaAsset>,
    mode: PlayMode,
    shuffle: (List<MediaAsset>) -> List<MediaAsset> = { it.shuffled() }
) {
    private val items = if (mode == PlayMode.SHUFFLED) shuffle(source) else source
    private var index = 0

    var isFinished: Boolean = items.isEmpty()
        private set

    val current: MediaAsset?
        get() = if (isFinished) null else items.getOrNull(index)

    fun advance(): MediaAsset? {
        if (isFinished) return null
        if (index == items.lastIndex) {
            isFinished = true
            return null
        }
        index += 1
        return current
    }

    fun previous(): MediaAsset? {
        if (items.isEmpty()) return null
        if (isFinished) {
            isFinished = false
            index = items.lastIndex
        } else {
            index = (index - 1).coerceAtLeast(0)
        }
        return current
    }
}
