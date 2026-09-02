using System.Net;
using System.Text.Json;
using HoaCommunityEvents.API.Middleware;
using HoaCommunityEvents.API.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Logging;
using Xunit;

namespace HoaCommunityEvents.API.Tests;

public class ExceptionMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_RequestAbortCancellation_DoesNotWriteOrLogServerError()
    {
        using var requestAborted = new CancellationTokenSource();
        requestAborted.Cancel();
        var context = NewContext();
        context.RequestAborted = requestAborted.Token;
        var logger = new RecordingLogger<ExceptionMiddleware>();
        var middleware = new ExceptionMiddleware(
            _ => throw new OperationCanceledException(requestAborted.Token),
            logger);

        await middleware.InvokeAsync(context);

        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
        Assert.Null(context.Response.ContentType);
        Assert.Equal(0, context.Response.Body.Length);
        Assert.DoesNotContain(LogLevel.Error, logger.Levels);
    }

    [Fact]
    public async Task InvokeAsync_OperationCanceledWithoutRequestAbort_ReturnsJsonServerError()
    {
        var context = NewContext();
        var logger = new RecordingLogger<ExceptionMiddleware>();
        var middleware = new ExceptionMiddleware(
            _ => throw new OperationCanceledException(),
            logger);

        await middleware.InvokeAsync(context);

        Assert.Equal(HttpStatusCode.InternalServerError, (HttpStatusCode)context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);
        Assert.Contains(LogLevel.Error, logger.Levels);
        var payload = await ReadPayloadAsync(context);
        Assert.Equal("internal_error", payload.Code);
        Assert.Equal(context.TraceIdentifier, payload.TraceId);
    }

    [Fact]
    public async Task InvokeAsync_UnrelatedExceptionBeforeResponseStarts_ReturnsJsonServerError()
    {
        var context = NewContext();
        var logger = new RecordingLogger<ExceptionMiddleware>();
        var middleware = new ExceptionMiddleware(
            _ => throw new InvalidOperationException("boom"),
            logger);

        await middleware.InvokeAsync(context);

        Assert.Equal(HttpStatusCode.InternalServerError, (HttpStatusCode)context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);
        Assert.Contains(LogLevel.Error, logger.Levels);
        var payload = await ReadPayloadAsync(context);
        Assert.Equal("internal_error", payload.Code);
        Assert.Equal("An unexpected server error occurred.", payload.Message);
        Assert.Equal(context.TraceIdentifier, payload.TraceId);
    }

    [Fact]
    public async Task InvokeAsync_UnrelatedExceptionAfterResponseStarts_RethrowsWithoutRewritingResponse()
    {
        var exception = new InvalidOperationException("stream failed");
        var context = NewContext();
        var originalBody = context.Response.Body;
        context.Features.Set<IHttpResponseFeature>(new StartedResponseFeature(originalBody));
        var logger = new RecordingLogger<ExceptionMiddleware>();
        var middleware = new ExceptionMiddleware(_ => throw exception, logger);

        var thrown = await Assert.ThrowsAsync<InvalidOperationException>(() => middleware.InvokeAsync(context));

        Assert.Same(exception, thrown);
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
        Assert.Null(context.Response.ContentType);
        Assert.Equal(0, originalBody.Length);
        Assert.Contains(LogLevel.Error, logger.Levels);
    }

    private static DefaultHttpContext NewContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<ApiErrorResponse> ReadPayloadAsync(HttpContext context)
    {
        context.Response.Body.Position = 0;
        return await JsonSerializer.DeserializeAsync<ApiErrorResponse>(
                   context.Response.Body,
                   new JsonSerializerOptions(JsonSerializerDefaults.Web))
               ?? throw new InvalidOperationException("Middleware did not write an API error payload.");
    }

    private sealed class StartedResponseFeature(Stream body) : IHttpResponseFeature
    {
        public int StatusCode { get; set; } = StatusCodes.Status200OK;
        public string? ReasonPhrase { get; set; }
        public IHeaderDictionary Headers { get; set; } = new HeaderDictionary();
        public Stream Body { get; set; } = body;
        public bool HasStarted => true;

        public void OnStarting(Func<object, Task> callback, object state)
        {
        }

        public void OnCompleted(Func<object, Task> callback, object state)
        {
        }
    }

    private sealed class RecordingLogger<T> : ILogger<T>
    {
        public List<LogLevel> Levels { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter) => Levels.Add(logLevel);
    }
}
