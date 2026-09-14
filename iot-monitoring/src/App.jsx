import { useEffect, useState } from "react";

import {
  Thermometer,
  Droplets,
  Sun,
  Activity,
  Wifi,
  Clock
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";


import "./App.css";

function SensorCard({ icon: Icon, title, value, unit, description }) {
  return (
    <div className="sensor-card">
      <div className="sensor-header">
        <div className="sensor-icon">
          <Icon size={22} />
        </div>

        <span>{title}</span>
      </div>

      <div className="sensor-value">
        {value}
        <small>{unit}</small>
      </div>

      <div className="sensor-description">
        {description}
      </div>
    </div>
  );
}

function App() {

  const [historyData, setHistoryData] = useState([]);

  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    ldrRaw: 0,
    light: 0,
  });

  const [lastUpdate, setLastUpdate] = useState(null);
  const [Online, setOnline] = useState(false);

  useEffect(() => {
    //const socket = new WebSocket("ws://192.168.137.1:1880/sensor");

    const fetchLatestSensorData = async () => {

      try {

        // =========================
        // GET LATEST SENSOR DATA
        // =========================

        const response = await fetch(
          "http://localhost:3000/api/sensor/latest"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch latest sensor data");
        }

        const result = await response.json();

        if (result.success && result.data) {

          setSensorData({
            temperature: Number(result.data.temperature),
            humidity: Number(result.data.humidity),
            ldrRaw: Number(result.data.ldr_raw),
            light: Number(result.data.light),
          });

          setLastUpdate(
            result.data.created_at
              ? new Date(result.data.created_at).toLocaleTimeString()
              : new Date().toLocaleTimeString()
          );

          setOnline(true);
        }


        // =========================
        // GET SENSOR HISTORY
        // =========================

        const historyResponse = await fetch(
          "http://localhost:3000/api/sensor/history"
        );

        if (!historyResponse.ok) {
          throw new Error("Failed to fetch sensor history");
        }

        const historyResult = await historyResponse.json();

        console.log("History API:", historyResult);

        // PERBAIKAN:
        // success berada di historyResult,
        // bukan historyResponse
        if (historyResult.success && historyResult.data) {

          const formattedData = historyResult.data
            .slice()
            .reverse()
            .map((item) => ({

              time: item.created_at
                ? new Date(item.created_at).toLocaleTimeString()
                : `#${item.id}`,

              temperature: Number(item.temperature),
              humidity: Number(item.humidity),
              ldrRaw: Number(item.ldr_raw),
              light: Number(item.light),

            }));

          console.log("Chart data:", formattedData);

          setHistoryData(formattedData);
        }

      } catch (Error) {

        console.log("API Error", Error);

        setOnline(false);
      }
    };


    fetchLatestSensorData();

    const interval = setInterval(
      fetchLatestSensorData,
      2000
    );

    return () => clearInterval(interval);

  }, []);


  /*const socket = new WebSocket("ws://localhost:1880/sensor");
  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    console.log("Sensor data:", data);

    setSensorData(data);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
  };

  return () => {
    socket.close();
  };
}, []);*/


  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">

        <div>
          <h1>IoT Environmental Monitoring</h1>

          <p>
            ESP8266 • DHT11 • LDR • MQTT
          </p>
        </div>

        <div className="status">

          <span
            className={`status-dot ${Online ? "" : "offline"
              }`}
          ></span>

          <Wifi size={17} />

          {Online ? "Online" : "Offline"}

        </div>

      </header>


      {/* SENSOR CARDS */}
      <main className="dashboard">

        <SensorCard
          icon={Thermometer}
          title="Temperature"
          value={sensorData.temperature}
          unit="°C"
          description="DHT11 Sensor"
        />

        <SensorCard
          icon={Droplets}
          title="Humidity"
          value={sensorData.humidity}
          unit="%"
          description="DHT11 Sensor"
        />

        <SensorCard
          icon={Sun}
          title="Light Level"
          value={sensorData.light}
          unit="%"
          description="LDR Sensor"
        />

        <SensorCard
          icon={Activity}
          title="LDR Raw"
          value={sensorData.ldrRaw}
          unit=""
          description="Analog Reading"
        />

      </main>


      {/* CHART */}
      <section className="chart-card">

        <div className="chart-header">

          <div>
            <h2>Sensor History</h2>
            <p>Realtime environmental data</p>
          </div>

          <div className="update-time">
            <Clock size={16} />
            Last update: {lastUpdate || "Just now"}
          </div>

        </div>

        <div className="chart-container">

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <LineChart data={historyData}>

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="time"
              />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="temperature"
                name="Temperature (°C)"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                connectNulls
              />

              <Line
                type="monotone"
                dataKey="humidity"
                name="Humidity (%)"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                connectNulls
              />

              <Line
                type="monotone"
                dataKey="light"
                name="Light (%)"
                stroke="#ffc658"
                strokeWidth={2}
                dot={false}
                connectNulls
              />

              <Line
                type="monotone"
                dataKey="ldrRaw"
                name="LDR Raw"
                stroke="#ff7300"
                strokeWidth={2}
                dot={false}
                connectNulls
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </section>

    </div>
  );
}

export default App;