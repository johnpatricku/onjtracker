// Global variables
let currentUser = null
let isTimedIn = false
let timeInTime = null
let isDarkMode = false
let dtrEntries = []

// DOM elements
const loginPage = document.getElementById("loginPage")
const registerPage = document.getElementById("registerPage")
const dashboardPage = document.getElementById("dashboardPage")

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  setupEventListeners()
  updateDateTime()
  generateCalendar()
  initializeDTR()

  // Update time every second
  setInterval(updateDateTime, 1000)
})

function initializeApp() {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem("ojtracker-theme")
  if (savedTheme === "dark") {
    toggleDarkMode()
  }

  // Check for saved login state
  const savedUser = localStorage.getItem("ojtracker-user")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)

    // Redirect based on role
    if (currentUser.role === "coordinator") {
      window.location.href = "coordinator-dashboard.html"
      return
    } else if (currentUser.role === "supervisor") {
      window.location.href = "supervisor-dashboard.html"
      return
    }

    showDashboard()
  } else {
    showLogin()
  }

  // Load DTR entries
  const savedDTR = localStorage.getItem("ojtracker-dtr")
  if (savedDTR) {
    dtrEntries = JSON.parse(savedDTR)
  }
}

function setupEventListeners() {
  // Login form
  document.getElementById("loginForm").addEventListener("submit", handleLogin)

  // Register form
  document.getElementById("registerForm").addEventListener("submit", handleRegister)

  // Navigation buttons
  document.getElementById("showRegister").addEventListener("click", showRegister)
  document.getElementById("showLogin").addEventListener("click", showLogin)

  // Theme toggles
  document.getElementById("themeToggle").addEventListener("click", toggleDarkMode)
  document.getElementById("dashboardThemeToggle").addEventListener("click", toggleDarkMode)

  // Dashboard navigation
  setupDashboardNavigation()

  // Quick time tracking
  document.getElementById("quickTimeIn").addEventListener("click", handleQuickTimeIn)
  document.getElementById("quickTimeOut").addEventListener("click", handleQuickTimeOut)

  // DTR form
  document.getElementById("dtrForm").addEventListener("submit", handleDTRSubmit)
  document.getElementById("clearDtrForm").addEventListener("click", clearDTRForm)

  // Forms
  document.getElementById("reportForm").addEventListener("submit", handleReportSubmit)
  document.getElementById("profileForm").addEventListener("submit", handleProfileUpdate)

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", handleLogout)

  // Mobile menu
  document.getElementById("mobileMenuToggle").addEventListener("click", toggleMobileMenu)

  // Notification button
  document.getElementById("notificationBtn").addEventListener("click", () => showTab("notifications"))

  // DTR date auto-fill
  document.getElementById("dtrDate").value = new Date().toISOString().split("T")[0]

  // DTR filters
  document.getElementById("filterMonth").addEventListener("change", filterDTREntries)
  document.getElementById("filterYear").addEventListener("change", filterDTREntries)

  // Export DTR
  document.getElementById("exportDtr").addEventListener("click", exportDTRData)
}

function setupDashboardNavigation() {
  // Desktop navigation
  const desktopNavBtns = document.querySelectorAll(".desktop-nav .nav-btn")
  desktopNavBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tab = e.currentTarget.dataset.tab
      showTab(tab)
      updateActiveNavButton(desktopNavBtns, e.currentTarget)
    })
  })

  // Mobile navigation (header menu)
  const mobileNavBtns = document.querySelectorAll(".mobile-menu .mobile-nav-btn")
  mobileNavBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tab = e.currentTarget.dataset.tab
      showTab(tab)
      updateActiveNavButton(mobileNavBtns, e.currentTarget)
      toggleMobileMenu() // Close menu after selection
    })
  })

  // Mobile bottom navigation
  const bottomNavBtns = document.querySelectorAll(".mobile-bottom-nav .mobile-nav-btn")
  bottomNavBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tab = e.currentTarget.dataset.tab
      showTab(tab)
      updateActiveNavButton(bottomNavBtns, e.currentTarget)
    })
  })
}

function updateActiveNavButton(buttons, activeButton) {
  buttons.forEach((btn) => btn.classList.remove("active"))
  activeButton.classList.add("active")
}

function showLogin() {
  hideAllPages()
  loginPage.classList.add("active")
}

function showRegister() {
  hideAllPages()
  registerPage.classList.add("active")
}

function showDashboard() {
  hideAllPages()
  dashboardPage.classList.add("active")
  showTab("dashboard")
}

function hideAllPages() {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active")
  })
}

function showTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active")
  })

  // Show selected tab
  const selectedTab = document.getElementById(tabName + "Tab")
  if (selectedTab) {
    selectedTab.classList.add("active")
  }

  // Update navigation buttons
  updateAllNavButtons(tabName)

  // Refresh DTR table if DTR tab is selected
  if (tabName === "dtr") {
    refreshDTRTable()
  }
}

function updateAllNavButtons(activeTab) {
  const allNavBtns = document.querySelectorAll("[data-tab]")
  allNavBtns.forEach((btn) => {
    if (btn.dataset.tab === activeTab) {
      btn.classList.add("active")
    } else {
      btn.classList.remove("active")
    }
  })
}

function handleLogin(e) {
  e.preventDefault()

  const idNumber = document.getElementById("idNumber").value
  const password = document.getElementById("password").value

  // Determine user role and name based on ID
  let role = "intern"
  let name = "John Doe"

  if (idNumber.startsWith("COORD")) {
    role = "coordinator"
    name = "Jane Smith"
  } else if (idNumber.startsWith("SUP")) {
    role = "supervisor"
    name = "Bob Wilson"
  } else if (idNumber.startsWith("INTERN")) {
    role = "intern"
    name = "John Doe"
  }

  // Simple validation (in real app, this would be server-side)
  if (idNumber && password) {
    currentUser = {
      id: idNumber,
      name: name,
      department: "Software Development",
      email: `${name.toLowerCase().replace(" ", ".")}@company.com`,
      role: role,
    }

    localStorage.setItem("ojtracker-user", JSON.stringify(currentUser))

    // Redirect based on role
    if (role === "coordinator") {
      window.location.href = "coordinator-dashboard.html"
      return
    } else if (role === "supervisor") {
      window.location.href = "supervisor-dashboard.html"
      return
    }

    showDashboard()
    showNotification("Login successful!", "success")
  } else {
    showNotification("Please fill in all fields", "error")
  }
}

function handleRegister(e) {
  e.preventDefault()

  const fullName = document.getElementById("fullName").value
  const email = document.getElementById("email").value
  const department = document.getElementById("department").value
  const coordinatorId = document.getElementById("coordinatorId").value
  const newPassword = document.getElementById("newPassword").value
  const confirmPassword = document.getElementById("confirmPassword").value

  if (newPassword !== confirmPassword) {
    showNotification("Passwords do not match", "error")
    return
  }

  if (fullName && email && department && coordinatorId && newPassword) {
    showNotification("Registration successful! Please login.", "success")
    showLogin()

    // Clear form
    document.getElementById("registerForm").reset()
  } else {
    showNotification("Please fill in all fields", "error")
  }
}

function handleQuickTimeIn() {
  isTimedIn = true
  timeInTime = new Date()

  document.getElementById("quickTimeIn").classList.add("hidden")
  document.getElementById("quickTimeOut").classList.remove("hidden")

  showNotification("Quick time-in recorded successfully", "success")

  // Save to localStorage
  localStorage.setItem(
    "ojtracker-timein",
    JSON.stringify({
      isTimedIn: true,
      timeInTime: timeInTime.toISOString(),
    }),
  )

  // Auto-fill DTR form
  const now = new Date()
  document.getElementById("timeIn").value = formatTimeForInput(now)
  document.getElementById("dtrStatus").value = "present"
}

function handleQuickTimeOut() {
  if (!isTimedIn || !timeInTime) {
    showNotification("Please time in first", "error")
    return
  }

  const timeOutTime = new Date()

  isTimedIn = false

  document.getElementById("quickTimeIn").classList.remove("hidden")
  document.getElementById("quickTimeOut").classList.add("hidden")

  showNotification("Quick time-out recorded successfully", "success")

  // Auto-fill DTR form
  document.getElementById("timeOut").value = formatTimeForInput(timeOutTime)

  // Calculate hours worked
  const hoursWorked = (timeOutTime - timeInTime) / (1000 * 60 * 60)

  // Clear from localStorage
  localStorage.removeItem("ojtracker-timein")
  timeInTime = null
}

function initializeDTR() {
  // Set today's date as default
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("dtrDate").value = today

  // Set current year in filter
  document.getElementById("filterYear").value = new Date().getFullYear()
}

function handleDTRSubmit(e) {
  e.preventDefault()

  const dtrData = {
    date: document.getElementById("dtrDate").value,
    status: document.getElementById("dtrStatus").value,
    timeIn: document.getElementById("timeIn").value,
    timeOut: document.getElementById("timeOut").value,
    breakStart: document.getElementById("breakStart").value,
    breakEnd: document.getElementById("breakEnd").value,
    activities: document.getElementById("dtrActivities").value,
    learnings: document.getElementById("dtrLearnings").value,
    challenges: document.getElementById("dtrChallenges").value,
    supervisor: document.getElementById("dtrSupervisor").value,
    timestamp: new Date().toISOString(),
  }

  // Validate required fields
  if (!dtrData.date || !dtrData.status) {
    showNotification("Please fill in required fields (Date and Status)", "error")
    return
  }

  // Check if entry already exists for this date
  const existingIndex = dtrEntries.findIndex((entry) => entry.date === dtrData.date)

  if (existingIndex !== -1) {
    // Update existing entry
    dtrEntries[existingIndex] = dtrData
    showNotification("DTR entry updated successfully!", "success")
  } else {
    // Add new entry
    dtrEntries.push(dtrData)
    showNotification("DTR entry saved successfully!", "success")
  }

  // Save to localStorage
  localStorage.setItem("ojtracker-dtr", JSON.stringify(dtrEntries))

  // Refresh DTR table
  refreshDTRTable()

  // Clear form
  clearDTRForm()
}

function clearDTRForm() {
  document.getElementById("dtrForm").reset()
  // Reset date to today
  document.getElementById("dtrDate").value = new Date().toISOString().split("T")[0]
}

function refreshDTRTable() {
  const tbody = document.getElementById("dtrTableBody")
  if (!tbody) return

  // Clear existing rows
  tbody.innerHTML = ""

  // Filter entries based on selected month/year
  const filterMonth = document.getElementById("filterMonth").value
  const filterYear = document.getElementById("filterYear").value

  const filteredEntries = dtrEntries.filter((entry) => {
    const entryDate = new Date(entry.date)
    const entryMonth = String(entryDate.getMonth() + 1).padStart(2, "0")
    const entryYear = String(entryDate.getFullYear())

    if (filterMonth && entryMonth !== filterMonth) return false
    if (filterYear && entryYear !== filterYear) return false

    return true
  })

  // Sort by date (newest first)
  filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Add rows to table
  filteredEntries.forEach((entry) => {
    const row = document.createElement("tr")

    const hours = calculateHours(entry.timeIn, entry.timeOut, entry.breakStart, entry.breakEnd)
    const statusBadge = getStatusBadge(entry.status)

    row.innerHTML = `
            <td>${formatDate(entry.date)}</td>
            <td>${statusBadge}</td>
            <td>${entry.timeIn ? formatTime12Hour(entry.timeIn) : "-"}</td>
            <td>${entry.timeOut ? formatTime12Hour(entry.timeOut) : "-"}</td>
            <td>${hours}</td>
            <td>
                <button class="btn-icon" onclick="viewDtrEntry('${entry.date}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editDtrEntry('${entry.date}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteDtrEntry('${entry.date}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `

    tbody.appendChild(row)
  })

  // Update summary
  updateDTRSummary(filteredEntries)
}

function calculateHours(timeIn, timeOut, breakStart, breakEnd) {
  if (!timeIn || !timeOut) return "-"

  const start = new Date(`2000-01-01T${timeIn}`)
  const end = new Date(`2000-01-01T${timeOut}`)

  let totalMinutes = (end - start) / (1000 * 60)

  // Subtract break time if provided
  if (breakStart && breakEnd) {
    const breakStartTime = new Date(`2000-01-01T${breakStart}`)
    const breakEndTime = new Date(`2000-01-01T${breakEnd}`)
    const breakMinutes = (breakEndTime - breakStartTime) / (1000 * 60)
    totalMinutes -= breakMinutes
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.round(totalMinutes % 60)

  return `${hours}.${minutes < 10 ? "0" : ""}${Math.round(minutes / 6)}h`
}

function getStatusBadge(status) {
  const badges = {
    present: '<span class="badge badge-success">Present</span>',
    absent: '<span class="badge badge-danger">Absent</span>',
    late: '<span class="badge badge-warning">Late</span>',
    "half-day": '<span class="badge badge-secondary">Half Day</span>',
    overtime: '<span class="badge badge-success">Overtime</span>',
  }

  return badges[status] || '<span class="badge badge-secondary">Unknown</span>'
}

function updateDTRSummary(entries) {
  const summaryItems = document.querySelectorAll(".summary-item .summary-value")
  if (summaryItems.length < 4) return

  const totalDays = entries.length
  const presentDays = entries.filter((e) => e.status === "present" || e.status === "overtime").length
  const lateDays = entries.filter((e) => e.status === "late").length

  let totalHours = 0
  entries.forEach((entry) => {
    if (entry.timeIn && entry.timeOut) {
      const start = new Date(`2000-01-01T${entry.timeIn}`)
      const end = new Date(`2000-01-01T${entry.timeOut}`)
      totalHours += (end - start) / (1000 * 60 * 60)
    }
  })

  summaryItems[0].textContent = totalDays
  summaryItems[1].textContent = presentDays
  summaryItems[2].textContent = lateDays
  summaryItems[3].textContent = `${Math.round(totalHours)}h`
}

function filterDTREntries() {
  refreshDTRTable()
}

function viewDtrEntry(date) {
  const entry = dtrEntries.find((e) => e.date === date)
  if (!entry) return

  const modal = document.getElementById("dtrModal")
  const modalTitle = document.getElementById("modalTitle")
  const modalBody = document.getElementById("modalBody")

  modalTitle.textContent = `DTR Entry - ${formatDate(date)}`

  modalBody.innerHTML = `
        <div class="dtr-details">
            <div class="detail-row">
                <strong>Status:</strong> ${getStatusBadge(entry.status)}
            </div>
            <div class="detail-row">
                <strong>Time In:</strong> ${entry.timeIn ? formatTime12Hour(entry.timeIn) : "Not recorded"}
            </div>
            <div class="detail-row">
                <strong>Time Out:</strong> ${entry.timeOut ? formatTime12Hour(entry.timeOut) : "Not recorded"}
            </div>
            <div class="detail-row">
                <strong>Break:</strong> ${
                  entry.breakStart && entry.breakEnd
                    ? `${formatTime12Hour(entry.breakStart)} - ${formatTime12Hour(entry.breakEnd)}`
                    : "No break recorded"
                }
            </div>
            <div class="detail-row">
                <strong>Hours Worked:</strong> ${calculateHours(entry.timeIn, entry.timeOut, entry.breakStart, entry.breakEnd)}
            </div>
            <div class="detail-row">
                <strong>Activities:</strong> ${entry.activities || "No activities recorded"}
            </div>
            <div class="detail-row">
                <strong>Learnings:</strong> ${entry.learnings || "No learnings recorded"}
            </div>
            <div class="detail-row">
                <strong>Challenges:</strong> ${entry.challenges || "No challenges recorded"}
            </div>
            <div class="detail-row">
                <strong>Supervisor:</strong> ${entry.supervisor || "Not specified"}
            </div>
        </div>
    `

  modal.classList.add("active")
}

function editDtrEntry(date) {
  const entry = dtrEntries.find((e) => e.date === date)
  if (!entry) return

  // Fill form with existing data
  document.getElementById("dtrDate").value = entry.date
  document.getElementById("dtrStatus").value = entry.status
  document.getElementById("timeIn").value = entry.timeIn || ""
  document.getElementById("timeOut").value = entry.timeOut || ""
  document.getElementById("breakStart").value = entry.breakStart || ""
  document.getElementById("breakEnd").value = entry.breakEnd || ""
  document.getElementById("dtrActivities").value = entry.activities || ""
  document.getElementById("dtrLearnings").value = entry.learnings || ""
  document.getElementById("dtrChallenges").value = entry.challenges || ""
  document.getElementById("dtrSupervisor").value = entry.supervisor || ""

  // Switch to DTR tab
  showTab("dtr")

  // Scroll to form
  document.getElementById("dtrForm").scrollIntoView({ behavior: "smooth" })

  showNotification("DTR entry loaded for editing", "info")
}

function deleteDtrEntry(date) {
  if (confirm("Are you sure you want to delete this DTR entry?")) {
    dtrEntries = dtrEntries.filter((e) => e.date !== date)
    localStorage.setItem("ojtracker-dtr", JSON.stringify(dtrEntries))
    refreshDTRTable()
    showNotification("DTR entry deleted successfully", "success")
  }
}

function closeDtrModal() {
  document.getElementById("dtrModal").classList.remove("active")
}

function exportDTRData() {
  if (dtrEntries.length === 0) {
    showNotification("No DTR data to export", "error")
    return
  }

  // Create CSV content
  const headers = [
    "Date",
    "Status",
    "Time In",
    "Time Out",
    "Break Start",
    "Break End",
    "Hours",
    "Activities",
    "Learnings",
    "Challenges",
    "Supervisor",
  ]
  const csvContent = [
    headers.join(","),
    ...dtrEntries.map((entry) =>
      [
        entry.date,
        entry.status,
        entry.timeIn || "",
        entry.timeOut || "",
        entry.breakStart || "",
        entry.breakEnd || "",
        calculateHours(entry.timeIn, entry.timeOut, entry.breakStart, entry.breakEnd),
        `"${entry.activities || ""}"`,
        `"${entry.learnings || ""}"`,
        `"${entry.challenges || ""}"`,
        entry.supervisor || "",
      ].join(","),
    ),
  ].join("\n")

  // Download CSV file
  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `DTR_${currentUser?.name || "Export"}_${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)

  showNotification("DTR data exported successfully", "success")
}

function handleReportSubmit(e) {
  e.preventDefault()

  const week = document.getElementById("reportWeek").value
  const content = document.getElementById("reportContent").value
  const file = document.getElementById("reportFile").files[0] // Get the file

  if (week && content) {
    // Handle file upload (example: log file name)
    if (file) {
      console.log("Uploaded file:", file.name)
    }

    showNotification("Report submitted successfully!", "success")
    document.getElementById("reportForm").reset()
  } else {
    showNotification("Please fill in all required fields", "error")
  }
}

function handleProfileUpdate(e) {
  e.preventDefault()

  showNotification("Profile updated successfully!", "success")
}

function handleLogout() {
  currentUser = null
  isTimedIn = false
  timeInTime = null

  localStorage.removeItem("ojtracker-user")
  localStorage.removeItem("ojtracker-timein")

  window.location.href = "index.html"
  showNotification("Logged out successfully", "success")
}

function toggleDarkMode() {
  isDarkMode = !isDarkMode
  document.body.classList.toggle("dark-mode")

  // Update theme toggle icons
  const themeIcons = document.querySelectorAll("#themeToggle i, #dashboardThemeToggle i")
  themeIcons.forEach((icon) => {
    if (isDarkMode) {
      icon.className = "fas fa-sun"
    } else {
      icon.className = "fas fa-moon"
    }
  })

  // Save theme preference
  localStorage.setItem("ojtracker-theme", isDarkMode ? "dark" : "light")
}

function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobileMenu")
  const menuToggle = document.getElementById("mobileMenuToggle")
  const icon = menuToggle.querySelector("i")

  mobileMenu.classList.toggle("active")

  if (mobileMenu.classList.contains("active")) {
    icon.className = "fas fa-times"
  } else {
    icon.className = "fas fa-bars"
  }
}

function updateDateTime() {
  const now = new Date()

  // Update current date
  const dateElement = document.getElementById("currentDate")
  if (dateElement) {
    dateElement.textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Update current time
  const timeElement = document.getElementById("currentTime")
  if (timeElement) {
    timeElement.textContent = formatTime(now)
  }
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatTime12Hour(timeString) {
  if (!timeString) return ""

  const [hours, minutes] = timeString.split(":")
  const hour = Number.parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12

  return `${displayHour}:${minutes} ${ampm}`
}

function formatTimeForInput(date) {
  return date.toTimeString().slice(0, 5)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function generateCalendar() {
  const calendarBody = document.getElementById("calendarBody")
  if (!calendarBody) return

  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  calendarBody.innerHTML = ""

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div")
    emptyCell.className = "calendar-date empty"
    calendarBody.appendChild(emptyCell)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div")
    dayCell.className = "calendar-date"
    dayCell.textContent = day

    // Highlight today
    if (day === today.getDate()) {
      dayCell.classList.add("today")
    }

    // Add activity indicators for certain days (report due dates)
    if ([5, 12, 19, 26].includes(day) && day !== today.getDate()) {
      dayCell.classList.add("activity")
    }

    calendarBody.appendChild(dayCell)
  }

  // Fill remaining cells
  const totalCells = calendarBody.children.length
  const remainingCells = 42 - totalCells // 6 rows × 7 days
  for (let i = 0; i < remainingCells; i++) {
    const emptyCell = document.createElement("div")
    emptyCell.className = "calendar-date empty"
    calendarBody.appendChild(emptyCell)
  }
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `

  notification.querySelector(".notification-content").style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `

  document.body.appendChild(notification)

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 100)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

function getNotificationIcon(type) {
  switch (type) {
    case "success":
      return "check-circle"
    case "error":
      return "exclamation-circle"
    case "warning":
      return "exclamation-triangle"
    default:
      return "info-circle"
  }
}

function getNotificationColor(type) {
  switch (type) {
    case "success":
      return "#10b981"
    case "error":
      return "#ef4444"
    case "warning":
      return "#f59e0b"
    default:
      return "#3b82f6"
  }
}

// Load saved time-in state on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedTimeIn = localStorage.getItem("ojtracker-timein")
  if (savedTimeIn) {
    const timeData = JSON.parse(savedTimeIn)
    if (timeData.isTimedIn) {
      isTimedIn = true
      timeInTime = new Date(timeData.timeInTime)

      const timeInBtn = document.getElementById("quickTimeIn")
      const timeOutBtn = document.getElementById("quickTimeOut")

      if (timeInBtn && timeOutBtn) {
        timeInBtn.classList.add("hidden")
        timeOutBtn.classList.remove("hidden")
      }
    }
  }
})

// Handle responsive behavior
window.addEventListener("resize", () => {
  // Close mobile menu on resize to desktop
  if (window.innerWidth >= 768) {
    const mobileMenu = document.getElementById("mobileMenu")
    const menuToggle = document.getElementById("mobileMenuToggle")

    if (mobileMenu && menuToggle) {
      const icon = menuToggle.querySelector("i")
      mobileMenu.classList.remove("active")
      if (icon) {
        icon.className = "fas fa-bars"
      }
    }
  }
})

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  const modal = document.getElementById("dtrModal")
  if (modal && e.target === modal) {
    closeDtrModal()
  }
})

// Prevent form submission on Enter key in certain inputs
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "submit") {
    const form = e.target.closest("form")
    if (form) {
      e.preventDefault()
      const submitBtn = form.querySelector('button[type="submit"]')
      if (submitBtn) {
        submitBtn.click()
      }
    }
  }
})
document.getElementById('showRegister').addEventListener('click', () => {
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('registerPage').classList.add('active');
});

document.getElementById('showLogin').addEventListener('click', () => {
  document.getElementById('registerPage').classList.remove('active');
  document.getElementById('loginPage').classList.add('active');
});
