using EventBusBrokers.Services;
using EventBusBrokers.Services.Base;
using EventBusBrokers.Settings;
using Helpers.Extensions;
using Microsoft.EntityFrameworkCore;
using MQTTnet;
using SatopsApplication.HttpClients.Clients;
using SatopsApplication.HttpClients.Clients.Base;
using SatopsApplication.HttpClients.Settings;
using SatopsApplication.Mapper;
using SatopsApplication.Services;
using SatopsApplication.Services.Base;
using Scalar.AspNetCore;
using Serilog;
using YarganCore.AppDbContext;
using YarganCore.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.Configure<HttpClientSettings>(builder.Configuration.GetSection("HttpClientEndPoints"));

builder.Services.AddHttpClient();

Log.Logger = new LoggerConfiguration()
              .WriteTo.Console()
              .CreateLogger();

#region MQTT

Log.Information("Mqtt connection preparing...");

builder.Services.Configure<MqttSettings>(builder.Configuration.GetSection("Mqtt"));

// MQTTnet 5.x sürümünde istemci oluşturma yöntemi:
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

#region DI

builder.Services.AddAutoMapper(opt =>
{
    opt.AddProfile<SatopsMappingProfile>();
});

builder.Services.AddScoped<SatellitePassesRepository>();

builder.Services.AddScoped<TleRepository>();

builder.Services.AddScoped<ITleService, TleService>();

builder.Services.AddScoped<IRuleApiHttpClients, RuleApiHttpClients>();

builder.Services.AddScoped<ISatellitePassService, SatellitePassService>();

Log.Information("Satops API started");

builder.Services.AddHealthChecks();

builder.Services.AddServiceHealthMonitoring(builder.Configuration);


#endregion

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health");

app.Run();
