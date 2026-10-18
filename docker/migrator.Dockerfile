# Veritabanı şemasını oluşturur/günceller (EF Core migration'ları), sonra çıkar.
# Startup projesi RuleAPI: EF Design paketi orada referanslı ve DbContext'i
# ConnectionStrings__Postgres ortam değişkeniyle DI'dan alır.
FROM mcr.microsoft.com/dotnet/sdk:10.0
WORKDIR /src
RUN dotnet tool install --global dotnet-ef --version "10.*"
ENV PATH="${PATH}:/root/.dotnet/tools"
COPY ["src/Rule/RuleAPI/RuleAPI.csproj", "src/Rule/RuleAPI/"]
COPY ["src/Rule/RuleApplication/RuleApplication.csproj", "src/Rule/RuleApplication/"]
COPY ["src/Common/Helper/Helpers/Helpers.csproj", "src/Common/Helper/Helpers/"]
COPY ["src/Core/YarganCore/YarganCore.csproj", "src/Core/YarganCore/"]
COPY ["src/MessageBrokers/EventBusBrokers/EventBusBrokers.csproj", "src/MessageBrokers/EventBusBrokers/"]
RUN dotnet restore "src/Rule/RuleAPI/RuleAPI.csproj"
COPY . .
RUN dotnet build "src/Rule/RuleAPI/RuleAPI.csproj" -c Release
ENTRYPOINT ["dotnet", "ef", "database", "update", "--no-build", "--configuration", "Release", "--project", "src/Core/YarganCore/YarganCore.csproj", "--startup-project", "src/Rule/RuleAPI/RuleAPI.csproj"]
