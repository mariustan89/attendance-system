// Your Firebase Config (Replace with actual Firebase config)
const firebaseConfig = {
    apiKey: "AIzaSyBv_l94vG3z1R2vxWzAiMRajvMNPAaokcE",
  authDomain: "attendance-system-5c06a.firebaseapp.com",
  projectId: "attendance-system-5c06a",
  storageBucket: "attendance-system-5c06a.firebasestorage.app",
  messagingSenderId: "167642168850",
  appId: "1:167642168850:web:b4c480593803a76a2662cb"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Function to Clock In/Out
async function clockInOut(workerID) {
    if (!workerID) {
        alert("No QR code detected!");
        return;
    }

    let now = new Date();
    let workerRef = db.collection("workers").doc(workerID);
    let doc = await workerRef.get();

    if (!doc.exists || !doc.data().clockIn) {
        // Clock In
        await workerRef.set({
            clockIn: now.toISOString(),
            clockOut: null
        });
        alert("Clocked In Successfully!");
    } else {
        // Clock Out
        await workerRef.update({
            clockOut: now.toISOString()
        });
        alert("Clocked Out Successfully!");
    }

    loadAttendance(); // Refresh table
}

// Function to Start QR Scanner
function startQRScanner() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera access is not supported on this browser.");
        return;
    }

    // Request Camera Permissions
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
            let scanner = new Html5QrcodeScanner("reader", {
                fps: 10,
                qrbox: 250
            });

            // When QR code is detected
            scanner.render((decodedText) => {
                document.getElementById("workerID").innerText = decodedText;
                scanner.clear(); // Stop scanner after scan
                clockInOut(decodedText); // Automatically log attendance
            });
        })
        .catch(err => {
            alert("Camera permission denied. Enable it in Chrome settings.");
            console.error("Camera error:", err);
        });
}

// Load attendance records into the table
async function loadAttendance() {
    let tableBody = document.getElementById("attendanceTable");
    tableBody.innerHTML = "";

    let snapshot = await db.collection("workers").get();
    snapshot.forEach(doc => {
        let data = doc.data();
        let clockInTime = data.clockIn ? new Date(data.clockIn).toLocaleTimeString() : "N/A";
        let clockOutTime = data.clockOut ? new Date(data.clockOut).toLocaleTimeString() : "N/A";
        let totalHours = data.clockIn && data.clockOut ? 
            ((new Date(data.clockOut) - new Date(data.clockIn)) / 3600000).toFixed(2) : "N/A";

        let row = `<tr>
            <td>${doc.id}</td>
            <td>${clockInTime}</td>
            <td>${clockOutTime}</td>
            <td>${totalHours}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// Start QR scanner and load attendance on page load
window.onload = function() {
    startQRScanner();
    loadAttendance();
};
