using EventBusBrokers.Services;
using EventBusBrokers.Services.Base;
using EventBusBrokers.Settings;
using Microsoft.EntityFrameworkCore;
using MQTTnet;
using RuleApplication.Mapper;
using RuleApplication.Services;
using RuleApplication.Services.Base;
using Scalar.AspNetCore;
using Serilog;
using YarganCore.AppDbContext;
using YarganCore.Entities;
using YarganCore.Repositories;
using YarganCore.Repositories.Base;
using Helpers;
using Helpers.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

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
    opt.AddProfile<RuleMappingProfile>();
});

builder.Services.AddScoped<ScriptRepository>();

builder.Services.AddScoped<CronPolicyRepository>();

builder.Services.AddScoped<IRepository<Scripts>, ScriptRepository>();

builder.Services.AddScoped<AlarmRepository>();

builder.Services.AddScoped<IPolicyScriptService, PolicyScriptService>();

builder.Services.AddScoped<ICronPolicyService, CronPolicyService>();

builder.Services.AddScoped<IAlarmService, AlarmService>();

Log.Information("Rule API started");

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