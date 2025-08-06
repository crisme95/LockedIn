export function init() {
    displaySessionStats();
}

export async function displaySessionStats() {
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

    const productivePercentage = Math.round((stats.productiveTime / totalTime) * 100);
    const distractingPercentage = Math.round((stats.distractingTime / totalTime) * 100);

    const sessionDuration = Math.round((stats.sessionEnd - stats.sessionStart) / 1000 / 60); // in minutes
    

    container.innerHTML = `
        
            <h2>Session Statistics</h2>
            <p>Session Duration: ${sessionDuration} minutes</p>
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