export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Welcome to Anime Tracker</h1>
      <p className="text-lg text-gray-600 mb-4">
        Track your favorite anime shows and never miss an episode.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Track Shows</h2>
          <p className="text-gray-600">
            Keep track of what you're watching, plan to watch, or have completed.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Stay Updated</h2>
          <p className="text-gray-600">
            Get notifications when new episodes are available for your favorite shows.
          </p>
        </div>
      </div>
    </div>
  );
} 