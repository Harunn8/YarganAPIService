using System;
using System.Collections.Generic;
using System.Text;
using MQTTnet;
using MQTTnet.Protocol;

namespace EventBusBrokers.Services.Base
{
    public interface IMqttConnection : IDisposable
    {
        void ConnectAsync();
        void DisconnectAsync();
        void PublishMessageAsync(string topic, string payload, MqttQualityOfServiceLevel qosLevel = MqttQualityOfServiceLevel.ExactlyOnce);
    }
}