package com.yilmaz.reelsplayer.ui

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class HomeScreenTest {
    @get:Rule
    val compose = createComposeRule()

    @Test
    fun homeShowsBothPlaybackModes() {
        compose.setContent {
            HomeScreen(
                mediaCount = 78,
                errorMessage = null,
                onSequential = {},
                onShuffled = {}
            )
        }

        compose.onNodeWithText("Sırayla Oynat").assertIsDisplayed()
        compose.onNodeWithText("Karışık Oynat").assertIsDisplayed()
        compose.onNodeWithText("78 medya hazır").assertIsDisplayed()
    }

    @Test
    fun selectingSequentialStartsPlayback() {
        var selected = false
        compose.setContent {
            HomeScreen(
                mediaCount = 78,
                errorMessage = null,
                onSequential = { selected = true },
                onShuffled = {}
            )
        }

        compose.onNodeWithText("Sırayla Oynat").performClick()

        assertTrue(selected)
    }
}
