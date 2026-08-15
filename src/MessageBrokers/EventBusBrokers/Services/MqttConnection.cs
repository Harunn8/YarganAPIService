using EventBusBrokers.Services.Base;
using EventBusBrokers.Settings;
using Microsoft.Extensions.Options;
using MQTTnet;
using MQTTnet.Protocol;

namespace EventBusBrokers.Services
{
    public class MqttConnection : IMqttConnection
    {
        private readonly MqttSettings _settings;
        private readonly IMqttClient _client;
        private readonly MqttClientOptions _options;

        public MqttConnection(IOptions<MqttSettings> settings, IMqttClient client)
        {
            _settings = settings.Value;

            _client = client;

            _options = new MqttClientOptionsBuilder()
                .WithTcpServer(_settings.Host, _settings.Port)
                .WithCleanSession()
                .Build();

            ConnectAsync();
        }

        public async void ConnectAsync()
        {
            if (_client.IsConnected) return;

            await _client.ConnectAsync(_options);
        }

        public void DisconnectAsync()
        {
            if (_client.IsConnected) return;

            _client.DisconnectAsync();

            Dispose();
        }

        public void Dispose()
        {
            _client.DisconnectAsync();

            _client.Dispose();
        }

        public async void PublishMessageAsync(string topic, string payload, MqttQualityOfServiceLevel qosLevel = MqttQualityOfServiceLevel.ExactlyOnce)
        {
            var message = new MqttApplicationMessageBuilder()
            .WithTopic(topic)
            .WithPayload(payload)
            .WithQualityOfServiceLevel(qosLevel)
            .Build();

            await _client.PublishAsync(message);
        }
    }
}