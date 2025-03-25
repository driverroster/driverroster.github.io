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
        const rows = csvText.trim().split("\n").map(row =>
            row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        );

        const headers = rows[0].map(h => h.trim());

        const colIndex = {
            date: headers.indexOf("Date"),
            unit: headers.indexOf("Unit"),
            driver: headers.indexOf("Driver Name"),
            run: headers.indexOf("Run"),
            off: headers.indexOf("Driver (on days off)"),
            shift: headers.indexOf("Shift"), // optional: if you want to categorize Day/Night
            destination: headers.indexOf("Destination"),
            start: headers.indexOf("Start Time")
        };

        shiftData = rows.slice(1).map(row => ({
            truck: row[colIndex.unit]?.trim(),
            start: row[colIndex.start]?.trim(),
            driver: row[colIndex.driver]?.trim().split(" ")[0],
            run: row[colIndex.run]?.trim().replace(/^"|"$/g, "").replace(/,/g, " - "),
            off: row[colIndex.off]?.trim().split(" ")[0],
            destination: row[colIndex.destination]?.trim(),
            shift: row[colIndex.shift]?.trim(),
            date: row[colIndex.date]?.trim()
        })).filter(entry =>
            entry.driver && entry.driver !== "0" &&
            Object.values(entry).some(val => val && val !== "0")
        );

        // Populate date dropdown
        const uniqueDates = [...new Set(shiftData.map(entry => entry.date))].sort();
        uniqueDates.forEach(date => {
            let option = document.createElement("option");
            option.value = date;
            option.textContent = date;
            dateSelect.appendChild(option);
        });

        if (uniqueDates.length > 0) {
            updateSchedule(uniqueDates[0]);
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
            <th>Departure Time</th>
            <th>Driver</th>
            <th>Run</th>
            <th>Off</th>
            <th>Destination</th>
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
                             <td>${entry.off}</td>
                             <td>${entry.destination}</td>`;
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

    // Dark Mode Handling
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
