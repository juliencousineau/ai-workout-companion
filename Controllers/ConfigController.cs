using Microsoft.AspNetCore.Mvc;

namespace WorkoutCompanion.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public ConfigController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet]
    public IActionResult GetConfig()
    {
        // Google Client IDs are public and safe to expose
        var clientId = _configuration["Authentication:Google:ClientId"] ?? "";
        
        return Ok(new
        {
            googleClientId = clientId
        });
    }
}
