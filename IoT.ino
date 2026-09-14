#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// =========================
// WiFi Configuration
// =========================
const char* ssid = "nduuu";
const char* password = "11111111";

// =========================
// MQTT Configuration
// =========================
const char* mqtt_server = "192.168.137.1";
const int mqtt_port = 1883;

// MQTT Topics
const char* topic_temperature = "monitoring/temperature";
const char* topic_humidity    = "monitoring/humidity";
const char* topic_ldr_raw     = "monitoring/ldr/raw";
const char* topic_light       = "monitoring/ldr/light";

// =========================
// Pin Configuration
// =========================
#define DHT_PIN D4
#define DHT_TYPE DHT11
#define LDR_PIN A0

DHT dht(DHT_PIN, DHT_TYPE);

// =========================
// MQTT Object
// =========================
WiFiClient espClient;
PubSubClient client(espClient);


// =========================
// Connect WiFi
// =========================
void setup_wifi() {

  delay(10);

  Serial.println();
  Serial.println("================================");
  Serial.println(" IoT Environmental Monitoring");
  Serial.println(" ESP8266 + DHT11 + LDR + MQTT");
  Serial.println("================================");
  Serial.println();

  Serial.print("Connecting to WiFi");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected!");

  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}


// =========================
// Connect MQTT
// =========================
void reconnectMQTT() {

  while (!client.connected()) {

    Serial.print("Connecting to MQTT...");

    String clientID = "ESP8266-" + String(ESP.getChipId());

    if (client.connect(clientID.c_str())) {

      Serial.println("Connected!");

    } else {

      Serial.print("Failed, rc=");
      Serial.print(client.state());

      Serial.println(" | Retry in 5 seconds");

      delay(5000);
    }
  }
}


// =========================
// SETUP
// =========================
void setup() {

  Serial.begin(115200);

  // Start DHT11
  dht.begin();

  // Connect WiFi
  setup_wifi();

  // MQTT Server
  client.setServer(mqtt_server, mqtt_port);

}


// =========================
// LOOP
// =========================
void loop() {

  // =========================
  // Check MQTT Connection
  // =========================
  if (!client.connected()) {
    reconnectMQTT();
  }

  client.loop();


  // =========================
  // Read DHT11
  // =========================
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();


  // =========================
  // Read LDR
  // =========================
  int ldrRaw = analogRead(LDR_PIN);


  // =========================
  // Check DHT11
  // =========================
  if (isnan(temperature) || isnan(humidity)) {

    Serial.println("ERROR: Gagal membaca DHT11!");

    delay(2000);

    return;
  }


  // =========================
  // Convert LDR
  // =========================
  int lightPercent = map(ldrRaw, 1023, 0, 0, 100);

  lightPercent = constrain(lightPercent, 0, 100);


  // =========================
  // Display Data
  // =========================
  Serial.println("--------------------------------");

  Serial.print("Temperature : ");
  Serial.print(temperature);
  Serial.println(" °C");

  Serial.print("Humidity    : ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("LDR Raw     : ");
  Serial.println(ldrRaw);

  Serial.print("Light Level : ");
  Serial.print(lightPercent);
  Serial.println(" %");


  // =========================
  // Convert Data to String
  // =========================

  char temperatureString[10];
  char humidityString[10];
  char ldrString[10];
  char lightString[10];

  dtostrf(temperature, 1, 2, temperatureString);
  dtostrf(humidity, 1, 2, humidityString);

  sprintf(ldrString, "%d", ldrRaw);
  sprintf(lightString, "%d", lightPercent);


  // =========================
  // Publish MQTT
  // =========================

  client.publish(
    topic_temperature,
    temperatureString
  );

  client.publish(
    topic_humidity,
    humidityString
  );

  client.publish(
    topic_ldr_raw,
    ldrString
  );

  client.publish(
    topic_light,
    lightString
  );


  Serial.println();
  Serial.println("MQTT Data Published!");

  Serial.println("--------------------------------");


  // =========================
  // Delay
  // =========================

  delay(2000);
}