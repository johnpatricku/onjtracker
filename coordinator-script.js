document.addEventListener("DOMContentLoaded", async () => {
  let currentUser = null
  let students = []
  let supervisors = []
  let assignments = []

  // Initialize dashboard
  await initDashboard()

  async function initDashboard() {
    currentUser = await checkAuth("coordinator")
    if (!currentUser) return

    // Update user info in header
    document.getElementById("userName").textContent = `Welcome, ${currentUser.full_name}`

    // Load data
    await loadData()

    // Setup event listeners
    setupEventListeners()

    // Update profile tab
    updateProfile()
  }

  async function loadData() {
    await Promise.all([loadStudents(), loadSupervisors(), loadAssignments()])

    updateDashboard()
    updateAssignmentModal()
    updateAssignmentsList()
    updateUsersList()
  }

  async function loadStudents() {
    const { data, error } = await supabase.from("users").select("*").eq("role", "student").order("full_name")

    if (error) {
      console.error("Error loading students:", error)
      return
    }

    students = data || []
  }

  async function loadSupervisors() {
    const { data, error } = await supabase.from("users").select("*").eq("role", "supervisor").order("full_name")

    if (error) {
      console.error("Error loading supervisors:", error)
      return
    }

    supervisors = data || []
  }

  async function loadAssignments() {
    const { data, error } = await supabase
      .from("assignments")
      .select(`
                *,
                student:student_id (
                    id,
                    full_name,
                    email,
                    department
                ),
                supervisor:supervisor_id (
                    id,
                    full_name,
                    email,
                    department
                )
            `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading assignments:", error)
      return
    }

    assignments = data || []
  }

  function updateDashboard() {
    // Update stats
    document.getElementById("totalStudents").textContent = students.length
    document.getElementById("totalSupervisors").textContent = supervisors.length

    const activeAssignments = assignments.filter((a) => a.status === "active")
    const completedAssignments = assignments.filter((a) => a.status === "completed")

    document.getElementById("activeAssignments").textContent = activeAssignments.length
    document.getElementById("completedAssignments").textContent = completedAssignments.length

    // Update recent assignments
    const recentAssignments = document.getElementById("recentAssignments")

    if (assignments.length === 0) {
      recentAssignments.innerHTML = '<p class="no-data">No assignments created yet</p>'
    } else {
      recentAssignments.innerHTML = assignments
        .slice(0, 5)
        .map(
          (assignment) => `
                <div class="assignment-item">
                    <div class="item-info">
                        <h4>${assignment.student.full_name}</h4>
                        <p>Supervised by ${assignment.supervisor.full_name}</p>
                        <p>Started: ${formatDate(assignment.start_date)}</p>
                    </div>
                    <span class="status-badge ${assignment.status}">${assignment.status}</span>
                </div>
            `,
        )
        .join("")
    }
  }

  function updateAssignmentModal() {
    const studentSelect = document.getElementById("studentSelect")
    const supervisorSelect = document.getElementById("supervisorSelect")

    // Populate student select
    studentSelect.innerHTML = '<option value="">Select a student</option>'
    students.forEach((student) => {
      const option = document.createElement("option")
      option.value = student.id
      option.textContent = `${student.full_name} - ${student.department}`
      studentSelect.appendChild(option)
    })

    // Populate supervisor select
    supervisorSelect.innerHTML = '<option value="">Select a supervisor</option>'
    supervisors.forEach((supervisor) => {
      const option = document.createElement("option")
      option.value = supervisor.id
      option.textContent = `${supervisor.full_name} - ${supervisor.department}`
      supervisorSelect.appendChild(option)
    })
  }

  function updateAssignmentsList() {
    const allAssignments = document.getElementById("allAssignments")

    if (assignments.length === 0) {
      allAssignments.innerHTML = '<p class="no-data">No assignments found</p>'
    } else {
      allAssignments.innerHTML = assignments
        .map(
          (assignment) => `
                <div class="assignment-item">
                    <div class="item-info">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <h4>Student</h4>
                                <p>${assignment.student.full_name}</p>
                                <p>${assignment.student.department}</p>
                            </div>
                            <div>
                                <h4>Supervisor</h4>
                                <p>${assignment.supervisor.full_name}</p>
                                <p>${assignment.supervisor.department}</p>
                            </div>
                        </div>
                        <p style="margin-top: 10px;">Started: ${formatDate(assignment.start_date)}</p>
                    </div>
                    <span class="status-badge ${assignment.status}">${assignment.status}</span>
                </div>
            `,
        )
        .join("")
    }
  }

  function updateUsersList() {
    // Update students list
    const studentsList = document.getElementById("studentsList")

    if (students.length === 0) {
      studentsList.innerHTML = '<p class="no-data">No students found</p>'
    } else {
      studentsList.innerHTML = students
        .map(
          (student) => `
                <div class="user-item">
                    <div class="item-info">
                        <h4>${student.full_name}</h4>
                        <p>${student.department}</p>
                        <p>${student.email}</p>
                    </div>
                    <span class="status-badge">Student</span>
                </div>
            `,
        )
        .join("")
    }

    // Update supervisors list
    const supervisorsList = document.getElementById("supervisorsList")

    if (supervisors.length === 0) {
      supervisorsList.innerHTML = '<p class="no-data">No supervisors found</p>'
    } else {
      supervisorsList.innerHTML = supervisors
        .map(
          (supervisor) => `
                <div class="user-item">
                    <div class="item-info">
                        <h4>${supervisor.full_name}</h4>
                        <p>${supervisor.department}</p>
                        <p>${supervisor.email}</p>
                    </div>
                    <span class="status-badge">Supervisor</span>
                </div>
            `,
        )
        .join("")
    }
  }

  function updateProfile() {
    document.getElementById("profileName").textContent = currentUser.full_name
    document.getElementById("profileEmail").textContent = currentUser.email
    document.getElementById("profileRole").textContent = currentUser.role
    document.getElementById("profileDepartment").textContent = currentUser.department
  }

  function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const tabName = this.dataset.tab

        // Update active tab button
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"))
        this.classList.add("active")

        // Update active tab content
        document.querySelectorAll(".tab-content").forEach((content) => {
          content.classList.remove("active")
        })
        document.getElementById(tabName).classList.add("active")
      })
    })

    // Modal controls
    const modal = document.getElementById("assignmentModal")
    const createBtn = document.getElementById("createAssignmentBtn")
    const closeBtn = document.getElementById("closeModal")

    createBtn.addEventListener("click", () => {
      modal.style.display = "block"
    })

    closeBtn.addEventListener("click", () => {
      modal.style.display = "none"
    })

    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none"
      }
    })

    // Assignment form submission
    document.getElementById("assignmentForm").addEventListener("submit", async (e) => {
      e.preventDefault()
      await createAssignment()
    })

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", logout)
  }

  async function createAssignment() {
    const studentId = document.getElementById("studentSelect").value
    const supervisorId = document.getElementById("supervisorSelect").value
    const startDate = document.getElementById("startDate").value

    if (!studentId || !supervisorId || !startDate) {
      showMessage("Please fill in all fields", "error")
      return
    }

    const { error } = await supabase.from("assignments").insert({
      student_id: studentId,
      supervisor_id: supervisorId,
      start_date: startDate,
      status: "active",
    })

    if (error) {
      showMessage(error.message, "error")
      return
    }

    showMessage("Assignment created successfully!", "success")

    // Close modal and reset form
    document.getElementById("assignmentModal").style.display = "none"
    document.getElementById("assignmentForm").reset()

    // Reload data
    await loadData()
  }
})

// Mock functions for demonstration purposes.  In a real application, these would be defined elsewhere.
async function checkAuth(role) {
  // Replace with actual authentication logic
  return { full_name: "Test User", email: "test@example.com", role: role, department: "IT" }
}

async function supabase() {
  // Replace with actual Supabase client initialization
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            data: [],
            error: null,
          }),
        }),
      }),
      insert: () => ({
        data: [],
        error: null,
      }),
    }),
  }
}

function formatDate(dateString) {
  // Replace with actual date formatting logic
  return dateString
}

function logout() {
  // Replace with actual logout logic
  console.log("Logged out")
}

function showMessage(message, type) {
  // Replace with actual message display logic
  console.log(`${type}: ${message}`)
}
