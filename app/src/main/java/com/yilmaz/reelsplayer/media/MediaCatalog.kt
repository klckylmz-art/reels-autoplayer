package com.yilmaz.reelsplayer.media

import android.content.res.AssetManager
import java.math.BigInteger

class MediaCatalog(
    private val listAssets: () -> Array<String>?
) {
    constructor(assetManager: AssetManager) : this({ assetManager.list(MEDIA_DIRECTORY) })

    fun load(): List<MediaAsset> = listAssets()
        .orEmpty()
        .mapNotNull(::toAsset)
        .sortedWith(NATURAL_MEDIA_COMPARATOR)

    private fun toAsset(fileName: String): MediaAsset? {
        val kind = when (fileName.substringAfterLast('.', "").lowercase()) {
            "webp" -> MediaKind.WEBP
            "mp4", "m4v", "mov", "webm", "mkv" -> MediaKind.VIDEO
            else -> return null
        }
        return MediaAsset(fileName, kind)
    }

    private companion object {
        const val MEDIA_DIRECTORY = "media"
        val TOKEN_PATTERN = Regex("""\d+|\D+""")

        val NATURAL_MEDIA_COMPARATOR = Comparator<MediaAsset> { left, right ->
            naturalCompare(left.fileName, right.fileName)
        }

        fun naturalCompare(left: String, right: String): Int {
            val leftTokens = TOKEN_PATTERN.findAll(left).map { it.value }.toList()
            val rightTokens = TOKEN_PATTERN.findAll(right).map { it.value }.toList()

            for (index in 0 until minOf(leftTokens.size, rightTokens.size)) {
                val leftToken = leftTokens[index]
                val rightToken = rightTokens[index]
                val comparison = if (
                    leftToken.all(Char::isDigit) && rightToken.all(Char::isDigit)
                ) {
                    BigInteger(leftToken).compareTo(BigInteger(rightToken))
                } else {
                    leftToken.compareTo(rightToken, ignoreCase = true)
                }
                if (comparison != 0) return comparison
            }

            return leftTokens.size.compareTo(rightTokens.size)
        }
    }
}
