var timer = Observable.Interval(TimeSpan.FromMilliseconds(100));
timer.Subscribe(tick => {
    httpClient.Request($"{backendUrl}/enabled")
    if(response) {
        httpClient.Request($"{backendUrl}/orders");
        HandleOrderResponse(response);
    }
});

void HandleOrderResponse(String response) {
    stations = JSON.fromJson(response);
}

