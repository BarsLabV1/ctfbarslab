FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["DetectiveCTF.API/DetectiveCTF.API.csproj", "DetectiveCTF.API/"]
COPY ["DetectiveCTF.Application/DetectiveCTF.Application.csproj", "DetectiveCTF.Application/"]
COPY ["DetectiveCTF.Core/DetectiveCTF.Core.csproj", "DetectiveCTF.Core/"]
COPY ["DetectiveCTF.Infrastructure/DetectiveCTF.Infrastructure.csproj", "DetectiveCTF.Infrastructure/"]

RUN dotnet restore "DetectiveCTF.API/DetectiveCTF.API.csproj"

COPY . .
WORKDIR /src/DetectiveCTF.API
RUN dotnet publish "DetectiveCTF.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends docker.io ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .
RUN mkdir -p /app/wwwroot/uploads

ENTRYPOINT ["dotnet", "DetectiveCTF.API.dll"]