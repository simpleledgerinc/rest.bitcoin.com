"use strict";
// Create rate limit per route
Object.defineProperty(exports, "__esModule", { value: true });
var RateLimit = require("express-rate-limit");
// Set max requests per minute
var maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : 60;
// Unique route mapped to its rate limit
var uniqueRateLimits = {};
var routeRateLimit = function (req, res, next) {
    // Disable rate limiting if 0 passed from RATE_LIMIT_MAX_REQUESTS
    if (maxRequests === 0)
        return next();
    // TODO: Set or disable rate limit if authenticated user
    // Current route
    var route = req.baseUrl + req.path;
    // Create new RateLimit if none exists for this route
    if (!uniqueRateLimits[route]) {
        uniqueRateLimits[route] = new RateLimit({
            windowMs: 60 * 1000,
            delayMs: 0,
            max: maxRequests,
            handler: function (req, res /*next*/) {
                res.format({
                    json: function () {
                        res.status(500).json({
                            error: "Too many requests. Limits are 60 requests per minute."
                        });
                    }
                });
            }
        });
    }
    // Call rate limit for this route
    uniqueRateLimits[route](req, res, next);
};
exports.routeRateLimit = routeRateLimit;
