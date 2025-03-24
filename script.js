document.addEventListener("DOMContentLoaded", function () {
    const dateSelect = document.getElementById("date-select");
    const scheduleContainer = document.getElementById("schedule-container");
    const darkModeToggle = document.getElementById("dark-mode-toggle");

    let shiftData = [];

    // Fetch CSV
    fetch("shifts.csv")
        .then(response => response.text())
        .then(csvText => processCSV(csvText))
        .catch(error => console.error("Failed to load CSV:", error));

    function processCSV(csvText) {
        // Handle quoted fields and split properly
        const rows = csvText.trim().split("\n").map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));

        shiftData = rows.slice(1).map(row => ({
            truck: row[0].trim(),
            start: row[1].trim(),
            driver: row[2].trim().split(" ")[0], // Extract only the first name
            run: row[3].trim().replace(/^"|"$/g, "").replace(/,/g, " - "), // Remove quotes and replace commas with dashes
            off: row[4].trim().split(" ")[0], // Extract only the first name
            shift: row[5].trim(),
            date: row[6].trim()
        }));

        // Populate date dropdown
        const uniqueDates = [...new Set(shiftData.map(entry => entry.date))].sort();
        uniqueDates.forEach(date => {
            let option = document.createElement("option");
            option.value = date;
            option.textContent = date;
            dateSelect.appendChild(option);
        });

        if (uniqueDates.length > 0) {
            updateSchedule(uniqueDates[0]); // Default to first date
        }
    }

    function updateSchedule(selectedDate) {
        scheduleContainer.innerHTML = "";

        let dayShift = shiftData.filter(entry => entry.date === selectedDate && entry.shift === "Day");
        let nightShift = shiftData.filter(entry => entry.date === selectedDate && entry.shift === "Night");

        if (dayShift.length > 0) {
            scheduleContainer.appendChild(createTable("Day Shift", dayShift));
        }
        if (nightShift.length > 0) {
            scheduleContainer.appendChild(createTable("Night Shift", nightShift));
        }
    }

    function createTable(title, data) {
        let table = document.createElement("table");
        let thead = document.createElement("thead");
        thead.innerHTML = `<tr>
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

        let tbody = document.createElement("tbody");
        data.forEach(entry => {
            let row = document.createElement("tr");
            row.innerHTML = `<td>${entry.truck}</td>
                             <td>${entry.start}</td>
                             <td>${entry.driver}</td>
                             <td>${entry.run}</td>
                             <td>${entry.off}</td>`;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        let section = document.createElement("div");
        section.innerHTML = `<h3>${title}</h3>`;
        section.appendChild(table);
        return section;
    }

    dateSelect.addEventListener("change", () => {
        updateSchedule(dateSelect.value);
    });

    // Dark Mode Handling (Manual Toggle Only)
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
