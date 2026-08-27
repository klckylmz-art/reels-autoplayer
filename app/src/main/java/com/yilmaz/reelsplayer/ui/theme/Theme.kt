package com.yilmaz.reelsplayer.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val ReelsColors = darkColorScheme(
    primary = Color.White,
    onPrimary = Color.Black,
    background = Color.Black,
    onBackground = Color.White,
    surface = Color(0xFF10121A),
    onSurface = Color.White
)

@Composable
fun ReelsPlayerTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = ReelsColors, content = content)
}
