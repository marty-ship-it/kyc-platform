export default function StandaloneLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">🚀 Kycira Platform - Public Access Test</h1>
        <p className="text-xl mb-8">This page loads without any authentication!</p>
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold mb-4">Demo Login Credentials:</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Director:</strong> sarah@coastalrealty.com / Password123!</div>
            <div><strong>Agent:</strong> luca@coastalrealty.com / Password123!</div>
            <div><strong>Compliance:</strong> priya@coastalrealty.com / Password123!</div>
          </div>
          <div className="mt-6">
            <a 
              href="/login" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg inline-block transition-colors"
            >
              Go to Real Login Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}