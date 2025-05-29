document.addEventListener("DOMContentLoaded", async () => {
  let currentUser = null
  let assignments = []
  let ratings = []
  let selectedRating = 0

  // Initialize dashboard
  await initDashboard()

  async function initDashboard() {
    currentUser = await checkAuth("student")
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
    await Promise.all([loadAssignments(), loadRatings()])

    updateDashboard()
    updateRatingForm()
    updateRatingsHistory()
  }

  async function loadAssignments() {
    const { data, error } = await supabase
      .from("assignments")
      .select(`
                id,
                supervisor:supervisor_id (
                    id,
                    full_name,
                    email,
                    department
                )
            `)
      .eq("student_id", currentUser.id)
      .eq("status", "active")

    if (error) {
      console.error("Error loading assignments:", error)
      return
    }

    assignments = data || []
  }

  async function loadRatings() {
    const { data, error } = await supabase
      .from("student_to_supervisor_ratings")
      .select("*")
      .eq("student_id", currentUser.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading ratings:", error)
      return
    }

    ratings = data || []
  }

  function updateDashboard() {
    // Update stats
    document.getElementById("assignmentCount").textContent = assignments.length
    document.getElementById("ratingsCount").textContent = ratings.length
    document.getElementById("userDepartment").textContent = currentUser.department

    // Update supervisors list
    const supervisorsList = document.getElementById("supervisorsList")

    if (assignments.length === 0) {
      supervisorsList.innerHTML = '<p class="no-data">No active assignments</p>'
    } else {
      supervisorsList.innerHTML = assignments
        .map(
          (assignment) => `
                <div class="supervisor-item">
                    <div class="item-info">
                        <h4>${assignment.supervisor.full_name}</h4>
                        <p>${assignment.supervisor.department}</p>
                        <p>${assignment.supervisor.email}</p>
                    </div>
                    <span class="status-badge active">Active</span>
                </div>
            `,
        )
        .join("")
    }
  }

  function updateRatingForm() {
    const supervisorSelect = document.getElementById("supervisorSelect")

    supervisorSelect.innerHTML = '<option value="">Choose a supervisor to rate</option>'

    assignments.forEach((assignment) => {
      const option = document.createElement("option")
      option.value = assignment.supervisor.id
      option.textContent = `${assignment.supervisor.full_name} - ${assignment.supervisor.department}`
      supervisorSelect.appendChild(option)
    })
  }

  function updateRatingsHistory() {
    const ratingsHistory = document.getElementById("ratingsHistory")

    if (ratings.length === 0) {
      ratingsHistory.innerHTML = '<p class="no-data">No ratings submitted yet</p>'
    } else {
      ratingsHistory.innerHTML = ratings
        .map(
          (rating) => `
                <div class="rating-item">
                    <div class="item-info">
                        <div class="star-rating-display">
                            ${generateStarsHTML(rating.rating)}
                        </div>
                        <p><strong>Date:</strong> ${formatDate(rating.created_at)}</p>
                        ${rating.feedback ? `<p><strong>Feedback:</strong> ${rating.feedback}</p>` : ""}
                    </div>
                </div>
            `,
        )
        .join("")
    }
  }

  function generateStarsHTML(rating) {
    let starsHTML = ""
    for (let i = 1; i <= 5; i++) {
      starsHTML += `<span class="star ${i <= rating ? "active" : ""}">⭐</span>`
    }
    return starsHTML
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

    // Star rating
    const starRating = document.getElementById("starRating")
    renderStars(0, starRating, true, (rating) => {
      selectedRating = rating
    })

    // Rating form submission
    document.getElementById("ratingForm").addEventListener("submit", async (e) => {
      e.preventDefault()
      await submitRating()
    })

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", logout)
  }

  async function submitRating() {
    const supervisorId = document.getElementById("supervisorSelect").value
    const feedback = document.getElementById("feedback").value

    if (!supervisorId || selectedRating === 0) {
      showMessage("Please select a supervisor and rating", "error")
      return
    }

    const { error } = await supabase.from("student_to_supervisor_ratings").insert({
      student_id: currentUser.id,
      supervisor_id: supervisorId,
      rating: selectedRating,
      feedback: feedback,
    })

    if (error) {
      showMessage(error.message, "error")
      return
    }

    showMessage("Rating submitted successfully!", "success")

    // Reset form
    document.getElementById("ratingForm").reset()
    selectedRating = 0
    renderStars(0, document.getElementById("starRating"), true, (rating) => {
      selectedRating = rating
    })

    // Reload data
    await loadData()
  }

  function showMessage(message, type = "info") {
    const messageContainer = document.getElementById("messageContainer")
    messageContainer.textContent = message
    messageContainer.className = `message ${type}`
    messageContainer.style.display = "block"

    setTimeout(() => {
      messageContainer.style.display = "none"
    }, 3000)
  }
})
