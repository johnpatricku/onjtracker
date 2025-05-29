// Replace these with your actual Supabase credentials
const SUPABASE_URL = "https://your-project-url.supabase.co"
const SUPABASE_ANON_KEY = "your-anon-key-here"

// Check if Supabase is loaded
if (typeof window.supabase === "undefined") {
  console.error("Supabase library not loaded! Make sure the CDN script is included.")
  alert("Error: Supabase library not loaded. Please refresh the page.")
}

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test connection on load
supabase
  .from("users")
  .select("count(*)", { count: "exact" })
  .then(({ data, error }) => {
    if (error) {
      console.error("Supabase connection error:", error)
    } else {
      console.log("✅ Supabase connected successfully!")
    }
  })

// Utility functions
function showMessage(message, type = "success") {
  const messageEl = document.getElementById("message")
  if (!messageEl) {
    console.error("Message element not found")
    alert(message)
    return
  }

  messageEl.textContent = message
  messageEl.className = `message ${type}`
  messageEl.style.display = "block"

  setTimeout(() => {
    messageEl.style.display = "none"
  }, 5000)
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

function renderStars(rating, container, interactive = false, callback = null) {
  if (!container) {
    console.error("Star container not found")
    return
  }

  container.innerHTML = ""
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span")
    star.className = `star ${i <= rating ? "active" : ""}`
    star.textContent = "⭐"
    star.dataset.rating = i

    if (interactive) {
      star.style.cursor = "pointer"
      star.addEventListener("click", () => {
        if (callback) callback(i)
        renderStars(i, container, interactive, callback)
      })
    }

    container.appendChild(star)
  }
}

// Check authentication
async function checkAuth(requiredRole = null) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = "index.html"
      return null
    }

    const { data: userData, error } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (error || !userData) {
      console.error("Error fetching user data:", error)
      await supabase.auth.signOut()
      window.location.href = "index.html"
      return null
    }

    if (requiredRole && userData.role !== requiredRole) {
      console.log(`Access denied. Required: ${requiredRole}, User role: ${userData.role}`)
      window.location.href = "index.html"
      return null
    }

    return userData
  } catch (error) {
    console.error("Auth check error:", error)
    window.location.href = "index.html"
    return null
  }
}

// Logout function
async function logout() {
  try {
    await supabase.auth.signOut()
    window.location.href = "index.html"
  } catch (error) {
    console.error("Logout error:", error)
    window.location.href = "index.html"
  }
}
