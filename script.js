document.addEventListener("DOMContentLoaded", function () {
    const dateSelect = document.getElementById("date-select");
    const scheduleContainer = document.getElementById("schedule-container");
    const darkModeToggle = document.getElementById("dark-mode-toggle");

    let shiftData = [];

    fetch("shifts.csv")
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.text();
        })
        .then(csvText => {
            processCSV(csvText);
        })
        .catch(error => console.error("Failed to load CSV:", error));

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
            console.error("One or more required columns are missing.");
            return;
        }

        shiftData = rows.slice(1).map(row => {
            const rawDateStr = row[colIndex.date]?.trim();
            const isoDate = normalizeToISODate(rawDateStr); // Internal date format

            return {
                truck: row[colIndex.unit]?.trim(),
                start: row[colIndex.start]?.trim(),
                driver: row[colIndex.driver]?.trim(),
                run: row[colIndex.run]?.trim(),
                off: row[colIndex.off]?.trim(),
                shift: row[colIndex.shift]?.trim(),
                rawDate: isoDate, // For internal comparison (YYYY-MM-DD)
                displayDate: formatToNZDate(isoDate) // For dropdown display
            };
        }).filter(entry =>
            Object.values(entry).some(val => val && val !== "0")
        );

        shiftData.sort((a, b) => a.rawDate.localeCompare(b.rawDate));

        const uniqueRawDates = [...new Set(shiftData.map(entry => entry.rawDate))];

        uniqueRawDates.forEach(isoDate => {
            const option = document.createElement("option");
            option.value = isoDate;
            option.textContent = formatToNZDate(isoDate);
            dateSelect.appendChild(option);
        });

        if (uniqueRawDates.length > 0) {
            updateSchedule(uniqueRawDates[0]);
        }

        dateSelect.addEventListener("change", () => {
            updateSchedule(dateSelect.value);
        });
    }

    function updateSchedule(selectedRawDate) {
        scheduleContainer.innerHTML = "";

        const dayShift = shiftData.filter(entry => entry.rawDate === selectedRawDate && entry.shift === "Day");
        const nightShift = shiftData.filter(entry => entry.rawDate === selectedRawDate && entry.shift === "Night");

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

    function normalizeToISODate(input) {
        if (!input) return "";
        const parts = input.includes("-") ? input.split("-") : input.split("/");

        let day, month, year;
        if (parts.length !== 3) return "";

        if (input.includes("-")) {
            [year, month, day] = parts;
        } else {
            if (parseInt(parts[2]) > 31) {
                [month, day, year] = parts;
            } else {
                [day, month, year] = parts;
            }
        }

        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    function formatToNZDate(isoDate) {
        const date = new Date(isoDate);
        if (isNaN(date)) return "";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function showBlankIfZero(value) {
        return value === "0" ? "" : value;
    }

    function createTable(title, data) {
        data.sort((a, b) => {
            const truckA = parseInt(a.truck) || 0;
            const truckB = parseInt(b.truck) || 0;
            return truckA - truckB;
        });

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
        section.innerHTML = `<h3>${title} (${formatToNZDate(data[0].rawDate)})</h3>`;
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
