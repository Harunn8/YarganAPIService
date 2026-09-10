using DeviceApplication.Mapper;
using DeviceApplication.Services;
using DeviceApplication.Services.Base;
using EventBusBrokers.Services;
using EventBusBrokers.Services.Base;
using EventBusBrokers.Settings;
using Helpers.Extensions;
using Helpers.UserLogService.Service;
using Helpers.UserLogService.Service.Base;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using MQTTnet;
using Scalar.AspNetCore;
using Serilog;
using System.Text.Json.Serialization;
using YarganCore.AppDbContext;
using YarganCore.Entities;
using YarganCore.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

#region MQTT

Log.Information("Mqtt connection preparing...");

builder.Services.Configure<MqttSettings>(builder.Configuration.GetSection("Mqtt"));

builder.Services.AddSingleton<IMqttClient>(sp =>
{
    var factory = new MQTTnet.MqttClientFactory();
    return factory.CreateMqttClient();
});

builder.Services.AddSingleton<IMqttConnection, MqttConnection>();

Log.Information("Mqtt connection was established");

#endregion

#region Postgres

builder.Services.AddDbContext<YarganAppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

#endregion

#region Mongo

var mongoConnectionString = builder.Configuration.GetConnectionString("MongoConnection") ?? builder.Configuration["MongoDbSettings:ConnectionString"];

var mongoDatabaseName = builder.Configuration["MongoDbSettings:DatabaseName"];

builder.Services.AddSingleton<IMongoClient>(sp => new MongoClient(mongoConnectionString));

builder.Services.AddScoped<IMongoDatabase>(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();
    return client.GetDatabase(mongoDatabaseName);
});

#endregion

builder.Services.AddAutoMapper(opt =>
{
    opt.AddProfile<DeviceMappingProfile>();
});

#region DI

builder.Services.AddScoped<DeviceRepository>();

builder.Services.AddScoped<PagDeviceRepository>();

builder.Services.AddScoped<PagRepository>();

builder.Services.AddScoped<IUserLogService, UserLogService>();

builder.Services.AddScoped<IDeviceService, DeviceService>();

builder.Services.AddScoped<IPagDeviceService, PagDeviceService>();

builder.Services.AddScoped<IPagService, PagService>();

builder.Services.AddHealthChecks();

builder.Services.AddServiceHealthMonitoring(builder.Configuration);

Log.Information("Device API started");

#endregion

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();

        app.MapScalarApiReference();
    }
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health");

app.Run();
