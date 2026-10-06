using Helpers.Extensions;
using Helpers.TokenInformation;
using Helpers.UserLogService.Service;
using Helpers.UserLogService.Service.Base;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using Scalar.AspNetCore;
using Serilog;
using System.Text.Json.Serialization;
using UserApplication.Mapper;
using UserApplication.Services;
using UserApplication.Services.Base;
using YarganCore.AppDbContext;
using YarganCore.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
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
    opt.AddProfile<UserMappingProfile>();
});

#region DI

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<UserRepository>();

builder.Services.AddScoped<IUserLogService, UserLogService>();

builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddHealthChecks();

builder.Services.AddServiceHealthMonitoring(builder.Configuration);

builder.Services.AddScoped<ITokenInformationService, TokenInformationService>();

Log.Information("User API started");

#endregion

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddOpenApi();

#region Authorization

//builder.Services.AddOpenApi(opt =>
//{
//    opt.AddDocumentTransformer((document, context, cancellationToken) =>
//    {
//        IDictionary<string, IOpenApiSecurityScheme> requirements = new Dictionary<string, IOpenApiSecurityScheme>
//        {
//            ["Bearer"] = new OpenApiSecurityScheme
//            {
//                Type = SecuritySchemeType.Http,
//                Scheme = "bearer",
//                In = ParameterLocation.Header,
//                BearerFormat = "JWT",
//                Description = "Enter token before use Bearer"
//            }
//        };

//        document.Components ??= new OpenApiComponents();

//        document.Components.SecuritySchemes = requirements;

//        return Task.CompletedTask;
//    });
//});
#endregion

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

//app.UseMiddleware<AuthorizeMiddleware>();  Geri kullanılacak middleware

app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health");

app.Run();