/**
 * The init function that is called by main.js when this page is loaded.
 */
export function init() {
    displaySessionStats();
}

/**
 * Gets and displays the statTrak tracked metrics.
 */
export async function displaySessionStats() {
    // Get stat from storage
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

    // Represents time working and time distracted as percentages of total time
    const productivePercentage = Math.round((stats.productiveTime / totalTime) * 100);
    const distractingPercentage = Math.round((stats.distractingTime / totalTime) * 100);

    const sessionDurationInSeconds = Math.round((stats.sessionEnd - stats.sessionStart) / 1000);
    const sessionMinutes = Math.floor(sessionDurationInSeconds / 60);
    const sessionSeconds = sessionDurationInSeconds % 60;


    // HTML container specifications
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