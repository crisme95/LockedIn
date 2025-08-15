/**
 * StatTrak module for tracking and displaying productivity metrics.
 * Shows how users spend their time during a Locked-In session by comparing
 * productive vs distracting time usage. Future improvements could include
 * more granular tracking, additional visualizations, or weekly reports.
 */

/**
 * Entry point for the StatTrak page.
 * Called by main.js when this page is loaded.
 */
export function init() {
    displaySessionStats();
}

/**
 * Retrieves session statistics from storage and renders them in a visual format.
 * Displays:
 * - Total session duration
 * - Productivity percentage with visual bar
 * - Time breakdown between productive and distracting activities
 * 
 * If no statistics are available (totalTime = 0), displays a placeholder message.
 */
export async function displaySessionStats() {
    // Get stats from storage
    const stats = await chrome.storage.local.get([
        'sessionStart',
        'sessionEnd',
        'distractingTime',
        'productiveTime'
    ]);

    const container = document.getElementById('stats-container');
    if (!container) return;
    const totalTime = stats.distractingTime + stats.productiveTime;
    if (totalTime === 0) {
        container.innerHTML = '<h2>No session statistics available yet.</h2>';
        return;
    }

    // Calculate productivity metrics as percentages
    const productivePercentage = Math.round((stats.productiveTime / totalTime) * 100);
    const distractingPercentage = Math.round((stats.distractingTime / totalTime) * 100);

    // Convert session duration from milliseconds to minutes and seconds
    const sessionDurationInSeconds = Math.round((stats.sessionEnd - stats.sessionStart) / 1000);
    const sessionMinutes = Math.floor(sessionDurationInSeconds / 60);
    const sessionSeconds = sessionDurationInSeconds % 60;

    // Render the statistics with a visual productivity bar
    container.innerHTML = `
        
            <h2>Session Statistics</h2>
            <p>Session Duration: ${sessionMinutes} minutes and ${sessionSeconds} seconds</p>
            <div class="productivity-bar">
                <div class="productive" style="width: ${productivePercentage}%">
                    ${productivePercentage}% Productive
                </div>
                <div class="distracting" style="width: ${distractingPercentage}%">
                    ${distractingPercentage}% Distracting
                </div>
            </div>
            <p>Time spent on productive tasks: ${Math.round(stats.productiveTime / 1000 / 60)} minutes</p>
            <p>Time spent on distracting sites: ${Math.round(stats.distractingTime / 1000 / 60)} minutes</p>
        
    `;
}