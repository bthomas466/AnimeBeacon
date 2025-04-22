import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ShowDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextEpisode, setNextEpisode] = useState(null);

  useEffect(() => {
    const fetchShow = async () => {
      try {
        const response = await fetch(`/api/shows/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch show details');
        }

        const data = await response.json();
        setShow(data);
        
        // Find the next upcoming episode
        if (data.episodes && data.episodes.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const upcomingEpisodes = data.episodes
            .filter(episode => {
              const airDate = new Date(episode.airDate);
              return airDate >= today;
            })
            .sort((a, b) => new Date(a.airDate) - new Date(b.airDate));
          
          setNextEpisode(upcomingEpisodes.length > 0 ? upcomingEpisodes[0] : null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShow();
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/watchlist" className="text-indigo-500 hover:text-indigo-600">
          Return to Watchlist
        </Link>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500 mb-4">Show not found</p>
        <Link to="/watchlist" className="text-indigo-500 hover:text-indigo-600">
          Return to Watchlist
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/watchlist" className="text-indigo-500 hover:text-indigo-600 mb-6 inline-block">
        ← Back to Watchlist
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Image and basic info */}
        <div className="md:col-span-1">
          <img
            src={show.coverImage}
            alt={show.title.english || show.title.romaji}
            className="w-full rounded-lg shadow-lg mb-4"
          />
          <div className="bg-white rounded-lg shadow p-4">
            <h1 className="text-2xl font-bold mb-2">
              {show.title.english || show.title.romaji}
            </h1>
            {show.title.native && (
              <p className="text-gray-600 mb-4">{show.title.native}</p>
            )}
            <div className="flex items-center mb-4">
              <span className={`px-3 py-1 rounded-full text-sm ${
                show.status === 'airing' ? 'bg-green-100 text-green-800' :
                show.status === 'finished' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {show.status.charAt(0).toUpperCase() + show.status.slice(1)}
              </span>
              <span className="ml-2 text-gray-600">
                {show.episodeCount} Episodes
              </span>
            </div>
          </div>
        </div>

        {/* Middle column: Synopsis and platforms */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Synopsis</h2>
            <p className="text-gray-700 whitespace-pre-line">{show.synopsis}</p>
          </div>

          {show.platforms && show.platforms.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Where to Watch</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {show.platforms.map((platform) => (
                  <a
                    key={platform.name}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 ${
                      platform.isPrimary ? 'border-indigo-300 bg-indigo-50 shadow-sm' : ''
                    }`}
                  >
                    <img
                      src={platform.logo}
                      alt={platform.name}
                      className="w-8 h-8 mr-3"
                    />
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium">{platform.name}</p>
                        {platform.isPrimary && (
                          <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 text-sm text-gray-500">
                        {platform.hasSub && <span>Sub</span>}
                        {platform.hasDub && <span>Dub</span>}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: Episode list */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Episodes</h2>
        <div className="space-y-4">
          {show.episodes.map((episode) => {
            const isNextEpisode = nextEpisode && episode.id === nextEpisode.id;
            const airDate = new Date(episode.airDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isUpcoming = airDate >= today;
            
            return (
              <div
                key={episode.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  isNextEpisode 
                    ? 'bg-indigo-50 border-indigo-200 shadow-md' 
                    : isUpcoming 
                      ? 'bg-blue-50 border-blue-100' 
                      : 'hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium">
                      Episode {episode.number}: {episode.title}
                    </h3>
                    {isNextEpisode && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                        Next Episode
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(episode.airDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {episode.subWatched && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Sub
                    </span>
                  )}
                  {episode.dubWatched && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Dub
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 