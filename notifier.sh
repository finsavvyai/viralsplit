#!/bin/bash

# ViralSplit Deployment Notifier
# Supports multiple notification methods: Slack, Discord, Email, Desktop notifications

# Configuration
SLACK_WEBHOOK_URL=""
DISCORD_WEBHOOK_URL=""
EMAIL_TO=""
PROJECT_NAME="ViralSplit"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Notification functions
send_slack_notification() {
    local message="$1"
    local color="$2"
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                'text': '$message',
                'attachments': [{
                    'color': '$color',
                    'fields': [{
                        'title': 'Project',
                        'value': '$PROJECT_NAME',
                        'short': true
                    }, {
                        'title': 'Time',
                        'value': '$(date)',
                        'short': true
                    }]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1
    fi
}

send_discord_notification() {
    local message="$1"
    local color="$2"
    
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                'embeds': [{
                    'title': '$PROJECT_NAME Notification',
                    'description': '$message',
                    'color': $color,
                    'timestamp': '$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'
                }]
            }" \
            "$DISCORD_WEBHOOK_URL" > /dev/null 2>&1
    fi
}

send_email_notification() {
    local subject="$1"
    local message="$2"
    
    if [ -n "$EMAIL_TO" ]; then
        echo "$message" | mail -s "$subject" "$EMAIL_TO" 2>/dev/null || \
        echo "Email notification failed. Install 'mail' command or configure SMTP."
    fi
}

send_desktop_notification() {
    local title="$1"
    local message="$2"
    
    # macOS
    if command -v osascript >/dev/null 2>&1; then
        osascript -e "display notification \"$message\" with title \"$title\"" 2>/dev/null
    # Linux
    elif command -v notify-send >/dev/null 2>&1; then
        notify-send "$title" "$message" 2>/dev/null
    fi
}

# Function for voice announcements
speak_announcement() {
    local message="$1"
    local platform="$2"
    
    # Get version string if available
    local version_string=""
    if [ -f "scripts/version.sh" ]; then
        version_string=$(./scripts/version.sh get-version 2>/dev/null || echo "")
    fi
    
    # Customize message based on platform and success
    if [[ "$message" == *"successful"* ]] || [[ "$message" == *"completed"* ]]; then
        if [ -n "$version_string" ]; then
            case "$platform" in
                "railway")
                    say "Railway deployment successful. Version $version_string is now live."
                    ;;
                "vercel")
                    say "Vercel deployment successful. Version $version_string is now live."
                    ;;
                *)
                    say "Deployment successful. Version $version_string is now live."
                    ;;
            esac
        else
            case "$platform" in
                "railway")
                    say "Railway deployment successful. API is now live."
                    ;;
                "vercel")
                    say "Vercel deployment successful. Web app is now live."
                    ;;
                *)
                    say "Deployment successful. Service is now live."
                    ;;
            esac
        fi
    elif [[ "$message" == *"Starting"* ]]; then
        case "$platform" in
            "railway")
                say "Starting Railway deployment for version $version_string"
                ;;
            "vercel")
                say "Starting Vercel deployment for version $version_string"
                ;;
            *)
                say "Starting deployment for version $version_string"
                ;;
        esac
    else
        if command -v say >/dev/null 2>&1; then
            # macOS - use say command
            say "$message" 2>/dev/null
        elif command -v espeak >/dev/null 2>&1; then
            # Linux - use espeak
            espeak "$message" 2>/dev/null
        elif command -v spd-say >/dev/null 2>&1; then
            # Linux - use speech-dispatcher
            spd-say "$message" 2>/dev/null
        fi
    fi
}

# Sound notification function
play_sound() {
    local sound_type="$1"
    
    case $sound_type in
        "railway")
            # Railway train sound (choo choo!)
            if command -v afplay >/dev/null 2>&1; then
                # macOS - play a system sound
                afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || \
                afplay /System/Library/Sounds/Ping.aiff 2>/dev/null || \
                echo -e "\a"  # Bell sound
            elif command -v paplay >/dev/null 2>&1; then
                # Linux with PulseAudio
                paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || \
                echo -e "\a"
            else
                echo -e "\a"  # Bell sound as fallback
            fi
            ;;
        "vercel")
            # Vercel deployment sound (success chime)
            if command -v afplay >/dev/null 2>&1; then
                # macOS - play a different system sound
                afplay /System/Library/Sounds/Ping.aiff 2>/dev/null || \
                afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || \
                echo -e "\a\a"  # Double bell sound
            elif command -v paplay >/dev/null 2>&1; then
                # Linux with PulseAudio
                paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || \
                echo -e "\a\a"
            else
                echo -e "\a\a"  # Double bell sound as fallback
            fi
            ;;
        "success")
            # Success sound
            if command -v afplay >/dev/null 2>&1; then
                afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || \
                echo -e "\a"
            elif command -v paplay >/dev/null 2>&1; then
                paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || \
                echo -e "\a"
            else
                echo -e "\a"
            fi
            ;;
        "error")
            # Error sound
            if command -v afplay >/dev/null 2>&1; then
                afplay /System/Library/Sounds/Basso.aiff 2>/dev/null || \
                echo -e "\a\a\a"  # Triple bell for error
            elif command -v paplay >/dev/null 2>&1; then
                paplay /usr/share/sounds/freedesktop/stereo/error.oga 2>/dev/null || \
                echo -e "\a\a\a"
            else
                echo -e "\a\a\a"  # Triple bell for error
            fi
            ;;
        *)
            echo -e "\a"  # Default bell sound
            ;;
    esac
}

# Main notification function
notify() {
    local type="$1"
    local message="$2"
    local color=""
    local emoji=""
    local sound_type=""
    local voice_message=""
    
    case $type in
        "success")
            color="good"
            emoji="✅"
            sound_type="success"
            voice_message="Deployment completed successfully! Wow, done!"
            echo -e "${GREEN}${emoji} $message${NC}"
            ;;
        "error")
            color="danger"
            emoji="❌"
            sound_type="error"
            voice_message="Deployment failed! Error occurred!"
            echo -e "${RED}${emoji} $message${NC}"
            ;;
        "warning")
            color="warning"
            emoji="⚠️"
            echo -e "${YELLOW}${emoji} $message${NC}"
            ;;
        "info")
            color="good"
            emoji="ℹ️"
            echo -e "${BLUE}${emoji} $message${NC}"
            ;;
        "deploy")
            color="good"
            emoji="🚀"
            echo -e "${PURPLE}${emoji} $message${NC}"
            ;;
        "railway")
            color="good"
            emoji="🚂"
            sound_type="railway"
            if [[ "$message" == *"starting"* ]] || [[ "$message" == *"Starting"* ]]; then
                voice_message="Starting Railway deployment!"
            elif [[ "$message" == *"completed"* ]] || [[ "$message" == *"successfully"* ]]; then
                voice_message="Railway deployment completed! Wow, done!"
            else
                voice_message="Railway deployment update!"
            fi
            echo -e "${BLUE}${emoji} $message${NC}"
            ;;
        "vercel")
            color="good"
            emoji="▲"
            sound_type="vercel"
            if [[ "$message" == *"starting"* ]] || [[ "$message" == *"Starting"* ]]; then
                voice_message="Starting Vercel deployment!"
            elif [[ "$message" == *"completed"* ]] || [[ "$message" == *"successfully"* ]]; then
                voice_message="Vercel deployment completed! Wow, done!"
            else
                voice_message="Vercel deployment update!"
            fi
            echo -e "${PURPLE}${emoji} $message${NC}"
            ;;
        *)
            color="good"
            emoji="📢"
            echo -e "${CYAN}${emoji} $message${NC}"
            ;;
    esac
    
    # Play sound notification
    play_sound "$sound_type"
    
    # Speak voice announcement
    if [ -n "$voice_message" ]; then
        speak_announcement "$voice_message" "$type"
    fi
    
    # Send notifications
    send_slack_notification "$message" "$color"
    send_discord_notification "$message" "$color"
    send_desktop_notification "$PROJECT_NAME" "$message"
}

# Deployment monitoring function
monitor_deployment() {
    local deployment_pid="$1"
    local deployment_name="$2"
    
    notify "deploy" "🚀 Starting $deployment_name deployment..."
    
    # Monitor deployment for up to 10 minutes
    for i in {1..60}; do
        if ! kill -0 $deployment_pid 2>/dev/null; then
            # Check if deployment was successful
            if wait $deployment_pid 2>/dev/null; then
                notify "success" "✅ $deployment_name deployment completed successfully!"
            else
                notify "error" "❌ $deployment_name deployment failed!"
            fi
            return 0
        fi
        
        sleep 10
    done
    
    notify "warning" "⚠️ $deployment_name deployment is taking longer than expected..."
}

# Health check function
check_health() {
    local service_name="$1"
    local health_url="$2"
    
    if curl -s "$health_url" > /dev/null 2>&1; then
        notify "success" "✅ $service_name is healthy and responding"
    else
        notify "error" "❌ $service_name health check failed"
    fi
}

# Test notification function
test_notifications() {
    echo "🧪 Testing notification system..."
    
    notify "info" "This is a test notification from ViralSplit"
    notify "success" "Success notification test"
    notify "warning" "Warning notification test"
    notify "error" "Error notification test"
    notify "deploy" "Deployment notification test"
    
    echo "✅ Notification tests completed"
}

# Main function
main() {
    case "$1" in
        "deploy")
            if [ -n "$2" ] && [ -n "$3" ]; then
                monitor_deployment "$2" "$3"
            else
                echo "Usage: $0 deploy <pid> <deployment_name>"
            fi
            ;;
        "health")
            if [ -n "$2" ] && [ -n "$3" ]; then
                check_health "$2" "$3"
            else
                echo "Usage: $0 health <service_name> <health_url>"
            fi
            ;;
        "test")
            test_notifications
            ;;
        "config")
            echo "📋 Current notification configuration:"
            echo "Slack Webhook: ${SLACK_WEBHOOK_URL:-Not configured}"
            echo "Discord Webhook: ${DISCORD_WEBHOOK_URL:-Not configured}"
            echo "Email: ${EMAIL_TO:-Not configured}"
            echo "Project: $PROJECT_NAME"
            ;;
        *)
            echo "ViralSplit Notification System"
            echo ""
            echo "Usage:"
            echo "  $0 deploy <pid> <name>    - Monitor deployment"
            echo "  $0 health <service> <url> - Check service health"
            echo "  $0 test                   - Test notifications"
            echo "  $0 config                 - Show configuration"
            echo ""
            echo "To configure notifications, edit this script and set:"
            echo "  SLACK_WEBHOOK_URL=\"your_slack_webhook\""
            echo "  DISCORD_WEBHOOK_URL=\"your_discord_webhook\""
            echo "  EMAIL_TO=\"your_email@example.com\""
            ;;
    esac
}

# Run main function with all arguments
main "$@"
