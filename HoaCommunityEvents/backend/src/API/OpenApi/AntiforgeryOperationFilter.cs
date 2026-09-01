using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace HoaCommunityEvents.API.OpenApi;

public sealed class AntiforgeryOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        if (context.ApiDescription.HttpMethod is not ("POST" or "PUT" or "PATCH" or "DELETE")) return;
        operation.Parameters ??= [];
        operation.Parameters.Add(new OpenApiParameter { Name = "X-CSRF-TOKEN", In = ParameterLocation.Header, Required = true, Schema = new OpenApiSchema { Type = JsonSchemaType.String } });
    }
}
