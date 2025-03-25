document.addEventListener("DOMContentLoaded", function () {
    const dateSelect = document.getElementById("date-select");
    const scheduleContainer = document.getElementById("schedule-container");
    const darkModeToggle = document.getElementById("dark-mode-toggle");

    let shiftData = [];

    console.log("📦 Fetching CSV file: shifts.csv...");
    fetch("shifts.csv")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
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

        console.log("🔍 Parsed headers:", headers);
        console.log("📌 Column indexes:", colIndex);

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

        console.log("📋 Parsed shift entries:", shiftData.length);
        if (shiftData.length > 0) {
            console.log("🧪 First entry:", shiftData[0]);
        }

        const uniqueDates = [...new Set(shiftData.map(entry => entry.date))].sort();
        console.log("📅 Unique dates:", uniqueDates);

        uniqueDates.forEach(date => {
            let option = document.createElement("option");
            option.value = date;
            option.textContent = date;
            dateSelect.appendChild(option);
        });

        if (uniqueDates.length > 0) {
            updateSchedule(uniqueDates[0]);
        } else {
            console.warn("⚠️ No valid dates found.");
        }
    }

    function updateSchedule(selectedDate) {
        console.log(`📆 Rendering schedule for: ${selectedDate}`);
        scheduleContainer.innerHTML = "";

        const dayShift = shiftData.filter(entry => entry.date === selectedDate && entry.shift === "Day");
        const nightShift = shiftData.filter(entry => entry.date === selectedDate && entry.shift === "Night");

        console.log("🌞 Day shift count:", dayShift.length);
        console.log("🌙 Night shift count:", nightShift.length);

        if (dayShift.length > 0) {
            scheduleContainer.appendChild(createTable("Day Shift", dayShift));
        }
        if (nightShift.length > 0) {
            scheduleContainer.appendChild(createTable("Night Shift", nightShift));
        }

        if (dayShift.length === 0 && nightShift.length === 0) {
            scheduleContainer.innerHTML = "<p>No shift data for selected date.</p>";
        }
    }

    function showBlankIfZero(value) {
        return value === "0" ? "" : value;
    }

    function createTable(title, data) {
        const table = document.createElement("table");
        const thead = document.createElement("thead");
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

        const tbody = document.createElement("tbody");
        data.forEach(entry => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${showBlankIfZero(entry.truck)}</td>
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

    dateSelect.addEventListener("change", () => {
        updateSchedule(dateSelect.value);
    });

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
