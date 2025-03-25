document.addEventListener("DOMContentLoaded", function () {
    const scheduleContainer = document.getElementById("schedule-container");
    const darkModeToggle = document.getElementById("dark-mode-toggle");

    let shiftData = [];

    console.log("📦 Fetching CSV file: shifts.csv...");
    fetch("shifts.csv")
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.text();
        })
        .then(csvText => {
            console.log("✅ CSV loaded successfully.");
            console.log("📄 CSV preview:", csvText.split("\n").slice(0, 5).join("\n"));
            processCSV(csvText);
        })
        .catch(error => console.error("❌ Failed to load CSV:", error));

    function processCSV(csvText) {
        const rows = csvText.trim().split("\n").map(row =>
            row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        );

        const headers = rows[0].map(h => h.trim());
        const colIndex = {
            date: headers.indexOf("Date"),
            unit: headers.indexOf("Truck"),
            driver: headers.indexOf("Driver"),
            run: headers.indexOf("Run"),
            off: headers.indexOf("Off"),
            shift: headers.indexOf("Shift"),
            start: headers.indexOf("Start")
        };

        if (Object.values(colIndex).some(index => index === -1)) {
            console.error("❗ One or more required columns are missing.");
            return;
        }

        shiftData = rows.slice(1).map(row => ({
            truck: row[colIndex.unit]?.trim(),
            start: row[colIndex.start]?.trim(),
            driver: row[colIndex.driver]?.trim(),
            run: row[colIndex.run]?.trim(),
            off: row[colIndex.off]?.trim(),
            shift: row[colIndex.shift]?.trim(),
            date: row[colIndex.date]?.trim()
        })).filter(entry =>
            entry.driver && entry.driver !== "0" &&
            Object.values(entry).some(val => val && val !== "0")
        );

        console.log("📋 Total entries to show:", shiftData.length);
        if (shiftData.length > 0) {
            console.log("🧪 First entry:", shiftData[0]);
        }

        scheduleContainer.appendChild(createTable("Full Roster", shiftData));
    }

    function showBlankIfZero(value) {
        return value === "0" ? "" : value;
    }

    function createTable(title, data) {
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        thead.innerHTML = `<tr>
            <th>Date</th>
            <th>Shift</th>
            <th>Truck</th>
            <th>Start</th>
            <th>Driver</th>
            <th>Run</th>
            <th>Off</th>
        </tr>`;
        thead.style.position = "sticky";
        thead.style.top = "0";
        thead.style.background = "#fff";
        thead.style.zIndex = "100";
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        data.forEach(entry => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${showBlankIfZero(entry.date)}</td>
                             <td>${showBlankIfZero(entry.shift)}</td>
                             <td>${showBlankIfZero(entry.truck)}</td>
                             <td>${showBlankIfZero(entry.start)}</td>
                             <td>${showBlankIfZero(entry.driver)}</td>
                             <td>${showBlankIfZero(entry.run)}</td>
                             <td>${showBlankIfZero(entry.off)}</td>`;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);

        const section = document.createElement("div");
        section.innerHTML = `<h3>${title}</h3>`;
        section.appendChild(table);
        return section;
    }

    function applyTheme() {
        const isDarkMode = localStorage.getItem("dark-mode") === "true";
        document.body.classList.toggle("dark-mode", isDarkMode);
        darkModeToggle.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
    }

    darkModeToggle.addEventListener("click", () => {
        const isDarkMode = document.body.classList.contains("dark-mode");
        document.body.classList.toggle("dark-mode", !isDarkMode);
        localStorage.setItem("dark-mode", !isDarkMode);
        darkModeToggle.textContent = !isDarkMode ? "Light Mode" : "Dark Mode";
    });

    applyTheme();
});
