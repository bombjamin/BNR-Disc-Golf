import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  CloudDrizzle,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  Umbrella,
  ChevronRight,
  CloudLightning,
  Sunrise,
  Sunset,
  MapPin,
  Navigation
} from "lucide-react";

// Weather coordinates for Blanco, Texas (Bar None Ranch)
const COORDINATES = {
  lat: 30.1007035,
  lon: -98.4220602
};

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    uvi: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    sunrise: number;
    sunset: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  };
  hourly: Array<{
    dt: number;
    temp: number;
    feels_like: number;
    humidity: number;
    pop: number;
    wind_speed: number;
    wind_deg: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
  daily: Array<{
    dt: number;
    temp: {
      day: number;
      min: number;
      max: number;
    };
    pop: number;
    uvi: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
  location: {
    name: string;
    country: string;
    lat: string;
    lon: string;
  };
}

const getWeatherIcon = (weatherMain: string, size: "sm" | "md" | "lg" = "md") => {
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-8 h-8";
  
  switch (weatherMain.toLowerCase()) {
    case "clear":
      return <Sun className={`${sizeClass} text-yellow-500`} />;
    case "clouds":
      return <Cloud className={`${sizeClass} text-gray-500`} />;
    case "rain":
      return <CloudRain className={`${sizeClass} text-blue-500`} />;
    case "drizzle":
      return <CloudDrizzle className={`${sizeClass} text-blue-400`} />;
    case "thunderstorm":
      return <CloudLightning className={`${sizeClass} text-purple-500`} />;
    case "snow":
      return <CloudSnow className={`${sizeClass} text-gray-300`} />;
    default:
      return <Sun className={`${sizeClass} text-yellow-500`} />;
  }
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleTimeString([], { 
    hour: 'numeric', 
    hour12: true 
  });
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString([], { 
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const getUVLevel = (uvi: number) => {
  if (uvi <= 2) return { level: "Low", color: "text-green-600" };
  if (uvi <= 5) return { level: "Moderate", color: "text-yellow-600" };
  if (uvi <= 7) return { level: "High", color: "text-orange-600" };
  if (uvi <= 10) return { level: "Very High", color: "text-red-600" };
  return { level: "Extreme", color: "text-purple-600" };
};

const getWindDirection = (degrees: number) => {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const formatSunTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

const getSunriseSunsetDisplay = (sunrise: number, sunset: number) => {
  const now = Date.now() / 1000;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (now < sunrise) {
    // Before sunrise - show sunrise first, then sunset
    return [
      { type: 'sunrise', time: sunrise, label: 'Sunrise' },
      { type: 'sunset', time: sunset, label: 'Sunset' }
    ];
  } else {
    // After sunrise - show sunset first, then tomorrow's sunrise
    const tomorrowSunrise = sunrise + (24 * 60 * 60); // Add 24 hours
    return [
      { type: 'sunset', time: sunset, label: 'Sunset' },
      { type: 'sunrise', time: tomorrowSunrise, label: 'Tomorrow' }
    ];
  }
};

export function WeatherWidget() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [showHourlyDetails, setShowHourlyDetails] = useState(false);

  const { data: weather, isLoading, error } = useQuery<WeatherData>({
    queryKey: ['/api/weather'],
    queryFn: async () => {
      const response = await fetch(`/api/weather?lat=${COORDINATES.lat}&lon=${COORDINATES.lon}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      return response.json();
    },
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  if (isLoading) {
    return (
      <Card className="border border-gray-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-dark-green flex items-center">
            <Sun className="w-5 h-5 mr-2" />
            Course Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="border border-gray-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-dark-green flex items-center">
            <Sun className="w-5 h-5 mr-2" />
            Course Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 mb-4">
              <Cloud className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Weather Service Unavailable</h3>
              <p className="text-sm text-gray-600 mb-3">
                Unable to fetch weather data for the golf course
              </p>
              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-xs text-gray-500">
                Weather API configuration needed for real-time conditions
              </div>
            </div>
            
            {/* Golf-specific weather tips */}
            <div className="bg-golf-bg rounded-xl p-4">
              <h4 className="font-semibold text-dark-green mb-2 flex items-center justify-center">
                <Sun className="w-4 h-4 mr-2" />
                Ideal Golf Conditions
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <Thermometer className="w-4 h-4 mx-auto mb-1 text-green-600" />
                  <div className="font-medium text-dark-green">65-75°F</div>
                  <div className="text-gray-600">Temperature</div>
                </div>
                <div className="text-center">
                  <Wind className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <div className="font-medium text-dark-green">&lt; 10 mph</div>
                  <div className="text-gray-600">Wind Speed</div>
                </div>
                <div className="text-center">
                  <Droplets className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <div className="font-medium text-dark-green">&lt; 20%</div>
                  <div className="text-gray-600">Rain Chance</div>
                </div>
                <div className="text-center">
                  <Sun className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                  <div className="font-medium text-dark-green">3-6 UV</div>
                  <div className="text-gray-600">UV Index</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentWeather = weather.current;
  const todayHourly = weather.hourly.slice(0, 24);
  const next3Days = weather.daily.slice(0, 3);
  const uvInfo = getUVLevel(currentWeather.uvi);
  const sunTimes = getSunriseSunsetDisplay(currentWeather.sunrise, currentWeather.sunset);

  return (
    <Card className="border border-gray-100 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-dark-green flex items-center justify-between">
          <div className="flex items-center">
            <Sun className="w-5 h-5 mr-2" />
            Course Weather
          </div>
          <div className="flex items-center text-sm font-normal text-gray-600">
            <MapPin className="w-4 h-4 mr-1" />
            {weather.location.name}, {weather.location.country}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview">Current</TabsTrigger>
            <TabsTrigger value="forecast">3-Day Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Current Weather */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getWeatherIcon(currentWeather.weather[0].main, "lg")}
                  <div>
                    <div className="text-3xl font-bold text-dark-green">
                      {Math.round(currentWeather.temp)}°F
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {currentWeather.weather[0].description}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Feels like</div>
                  <div className="text-lg font-semibold text-dark-green">
                    {Math.round(currentWeather.feels_like)}°F
                  </div>
                </div>
              </div>

              {/* Sunrise/Sunset - Better positioned */}
              <div className="flex items-center justify-between mb-4 px-2">
                {sunTimes.map((sunTime, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-white/40 dark:bg-black/20 rounded-lg p-3 flex-1 mx-1">
                    {sunTime.type === 'sunrise' ? (
                      <Sunrise className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Sunset className="w-5 h-5 text-orange-600" />
                    )}
                    <div>
                      <div className="text-xs text-gray-600">{sunTime.label}</div>
                      <div className="text-sm font-semibold text-dark-green">
                        {formatSunTime(sunTime.time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Weather Details Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-blue-600" style={{ transform: `rotate(${currentWeather.wind_deg}deg)` }} />
                    <span className="text-sm text-gray-600">Wind</span>
                  </div>
                  <div className="font-semibold text-dark-green">
                    {Math.round(currentWeather.wind_speed)} mph {getWindDirection(currentWeather.wind_deg)}
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Humidity</span>
                  </div>
                  <div className="font-semibold text-dark-green">
                    {currentWeather.humidity}%
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-600">UV Index</span>
                  </div>
                  <div className={`font-semibold ${uvInfo.color}`}>
                    {currentWeather.uvi.toFixed(1)} - {uvInfo.level}
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Visibility</span>
                  </div>
                  <div className="font-semibold text-dark-green">
                    {Math.round(currentWeather.visibility / 1609)} mi
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Hourly Forecast */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-dark-green flex items-center">
                  <Thermometer className="w-4 h-4 mr-2" />
                  Today's Hourly Forecast
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHourlyDetails(!showHourlyDetails)}
                  className="text-xs"
                >
                  {showHourlyDetails ? "Simple" : "Details"}
                </Button>
              </div>
              <div className="flex overflow-x-auto space-x-3 pb-2">
                {todayHourly.map((hour, index) => (
                  <div key={index} className={`flex-shrink-0 bg-golf-bg rounded-lg p-3 text-center ${showHourlyDetails ? 'min-w-[120px]' : 'min-w-[80px]'}`}>
                    <div className="text-xs text-gray-600 mb-1">
                      {formatTime(hour.dt)}
                    </div>
                    <div className="flex justify-center mb-2">
                      {getWeatherIcon(hour.weather[0].main, "sm")}
                    </div>
                    <div className="text-sm font-semibold text-dark-green mb-1">
                      {Math.round(hour.temp)}°
                    </div>
                    
                    {showHourlyDetails ? (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          Feels {Math.round(hour.feels_like)}°
                        </div>
                        {hour.pop > 0 && (
                          <div className="flex items-center justify-center text-xs text-blue-600">
                            <Droplets className="w-3 h-3 mr-1" />
                            {Math.round(hour.pop * 100)}% rain
                          </div>
                        )}
                        {hour.wind_speed > 0 && (
                          <div className="flex items-center justify-center text-xs text-gray-600">
                            <Wind className="w-3 h-3 mr-1" />
                            {Math.round(hour.wind_speed)} {getWindDirection(hour.wind_deg)}
                          </div>
                        )}
                        <div className="text-xs text-gray-600">
                          {hour.humidity}% humidity
                        </div>
                      </div>
                    ) : (
                      hour.pop > 0 && (
                        <div className="flex items-center justify-center text-xs text-blue-600">
                          <Droplets className="w-3 h-3 mr-1" />
                          {Math.round(hour.pop * 100)}%
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-3">
            {next3Days.map((day, index) => {
              const uvInfo = getUVLevel(day.uvi);
              return (
                <div 
                  key={index}
                  className="bg-golf-bg rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedDay(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getWeatherIcon(day.weather[0].main)}
                      <div>
                        <div className="font-semibold text-dark-green">
                          {index === 0 ? "Today" : formatDate(day.dt)}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {day.weather[0].description}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-dark-green">
                          {Math.round(day.temp.max)}°
                        </span>
                        <span className="text-gray-500">
                          {Math.round(day.temp.min)}°
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-end space-x-3 mt-1">
                        {day.pop > 0 && (
                          <div className="flex items-center text-xs text-blue-600">
                            <Umbrella className="w-3 h-3 mr-1" />
                            {Math.round(day.pop * 100)}%
                          </div>
                        )}
                        <div className={`text-xs ${uvInfo.color}`}>
                          UV {day.uvi.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}