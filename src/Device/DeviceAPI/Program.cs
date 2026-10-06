using DeviceApplication.Mapper;
using DeviceApplication.Services;
using DeviceApplication.Services.Base;
using EventBusBrokers.Services;
using EventBusBrokers.Services.Base;
using EventBusBrokers.Settings;
using Helpers.Extensions;
using Helpers.Middlewares;
using Helpers.TokenInformation;
using Helpers.UserLogService.Service;
using Helpers.UserLogService.Service.Base;
using Microsoft.AspNetCore.Authentication.JwtBearer; // EKLENDİ
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens; // EKLENDİ
using Microsoft.OpenApi;
using MongoDB.Driver;
using MQTTnet;
using Scalar.AspNetCore;
using Serilog;
using System.Reflection.Metadata;
using System.Text; // EKLENDİ
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
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<DeviceRepository>();
builder.Services.AddScoped<PagDeviceRepository>();
builder.Services.AddScoped<PagRepository>();
builder.Services.AddScoped<IUserLogService, UserLogService>();
builder.Services.AddScoped<IDeviceService, DeviceService>();
builder.Services.AddScoped<IPagDeviceService, PagDeviceService>();
builder.Services.AddScoped<IPagService, PagService>();
builder.Services.AddHealthChecks();
builder.Services.AddServiceHealthMonitoring(builder.Configuration);
builder.Services.AddScoped<ITokenInformationService, TokenInformationService>();
Log.Information("Device API started");
#endregion

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

#region OpenAPI / Scalar
builder.Services.AddOpenApi(opt =>
{
    opt.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        IDictionary<string, IOpenApiSecurityScheme> requirements = new Dictionary<string, IOpenApiSecurityScheme>
        {
            ["Bearer"] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                In = ParameterLocation.Header,
                BearerFormat = "JWT",
                Description = "Enter token before use Bearer"
            }
        };

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes = requirements;

        return Task.CompletedTask;
    });
});
#endregion

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.UseMiddleware<AuthorizeMiddleware>();

app.MapControllers();

app.MapHealthChecks("/health");

app.Run();