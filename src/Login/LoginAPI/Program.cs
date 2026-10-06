using Helpers.Extensions;
using LoginApplication.HttpClients.Services;
using LoginApplication.HttpClients.Services.Base;
using LoginApplication.HttpClients.Settings;
using LoginApplication.Services;
using LoginApplication.Services.Base;
using Scalar.AspNetCore;
using Serilog;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
#region DI

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<ILoginService,LoginService>();

builder.Services.Configure<UserAPIClientSettings>(builder.Configuration.GetSection("HttpClientEndPoints"));

builder.Services.AddHttpClient<IUserAPIClient, UserAPIClient>();

builder.Services.AddHealthChecks();

builder.Services.AddServiceHealthMonitoring(builder.Configuration);

Log.Information("Login API started");

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