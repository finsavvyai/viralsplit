#!/bin/bash

# Version management script for ViralSplit
# Usage: ./scripts/version.sh [increment|show|deploy|status]

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$SCRIPT_DIR/../version.json"
DEPLOYMENT_LOG="deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to read current version
get_current_version() {
    if [ -f "$VERSION_FILE" ]; then
        jq -r '.version' "$VERSION_FILE"
    else
        echo "1.0.0"
    fi
}

# Function to read current build number
get_current_build() {
    if [ -f "$VERSION_FILE" ]; then
        jq -r '.build' "$VERSION_FILE"
    else
        echo "1"
    fi
}

# Function to increment build number
increment_build() {
    local current_build=$(get_current_build)
    local new_build=$((current_build + 1))
    
    echo -e "${BLUE}Incrementing build number from $current_build to $new_build${NC}"
    
    # Update version.json
    jq ".build = $new_build" "$VERSION_FILE" > temp_version.json && mv temp_version.json "$VERSION_FILE"
    
    echo -e "${GREEN}Build number incremented to $new_build${NC}"
    return $new_build
}

# Function to show current version info
show_version() {
    if [ -f "$VERSION_FILE" ]; then
        echo -e "${BLUE}=== ViralSplit Version Info ===${NC}"
        echo -e "Version: ${GREEN}$(jq -r '.version' "$VERSION_FILE")${NC}"
        echo -e "Build: ${GREEN}$(jq -r '.build' "$VERSION_FILE")${NC}"
        echo -e "Last Railway Deployment: ${YELLOW}$(jq -r '.last_deployment.railway.deployed_at // "Never"' "$VERSION_FILE")${NC}"
        echo -e "Last Vercel Deployment: ${YELLOW}$(jq -r '.last_deployment.vercel.deployed_at // "Never"' "$VERSION_FILE")${NC}"
        echo ""
        echo -e "${BLUE}Recent Changes:${NC}"
        jq -r '.changelog[-1].changes[]' "$VERSION_FILE" | while read -r change; do
            echo -e "  • ${change}"
        done
    else
        echo -e "${RED}Version file not found!${NC}"
    fi
}

# Function to update deployment status
update_deployment_status() {
    local platform=$1
    local status=$2
    local build=$(get_current_build)
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    echo -e "${BLUE}Updating $platform deployment status...${NC}"
    
    # Update deployment status
    jq ".last_deployment.$platform.build = $build | .last_deployment.$platform.deployed_at = \"$timestamp\" | .last_deployment.$platform.status = \"$status\"" "$VERSION_FILE" > temp_version.json && mv temp_version.json "$VERSION_FILE"
    
    echo -e "${GREEN}$platform deployment status updated${NC}"
}

# Function to get current version string
get_version_string() {
    local version=$(get_current_version)
    local build=$(get_current_build)
    echo "v${version}-build${build}"
}

# Function to add changelog entry
add_changelog_entry() {
    local changes=("$@")
    local version=$(get_current_version)
    local build=$(get_current_build)
    local date=$(date +"%Y-%m-%d")
    
    echo -e "${BLUE}Adding changelog entry...${NC}"
    
    # Create new changelog entry
    local changelog_entry=$(jq -n \
        --arg version "$version" \
        --arg build "$build" \
        --arg date "$date" \
        --argjson changes "$(printf '%s\n' "${changes[@]}" | jq -R . | jq -s .)" \
        '{
            version: $version,
            build: ($build | tonumber),
            date: $date,
            changes: $changes
        }')
    
    # Add to changelog
    jq ".changelog += [$changelog_entry]" "$VERSION_FILE" > temp_version.json && mv temp_version.json "$VERSION_FILE"
    
    echo -e "${GREEN}Changelog entry added${NC}"
}

# Function to check deployment status
check_deployment_status() {
    echo -e "${BLUE}=== Deployment Status ===${NC}"
    
    # Check Railway
    echo -e "${YELLOW}Railway API:${NC}"
    if curl -s -f "https://api.viralsplit.io/health" > /dev/null; then
        echo -e "  Status: ${GREEN}Online${NC}"
        update_deployment_status "railway" "online"
    else
        echo -e "  Status: ${RED}Offline${NC}"
        update_deployment_status "railway" "offline"
    fi
    
    # Check Vercel
    echo -e "${YELLOW}Vercel Web App:${NC}"
    if curl -s -f "https://viralsplit.io" > /dev/null; then
        echo -e "  Status: ${GREEN}Online${NC}"
        update_deployment_status "vercel" "online"
    else
        echo -e "  Status: ${RED}Offline${NC}"
        update_deployment_status "vercel" "offline"
    fi
    
    echo ""
    show_version
}

# Function to create deployment tag
create_deployment_tag() {
    local build=$(get_current_build)
    local version=$(get_current_version)
    local tag="v${version}-build${build}"
    
    echo -e "${BLUE}Creating deployment tag: $tag${NC}"
    
    # Create git tag
    git tag -a "$tag" -m "Deployment build $build - $version"
    git push origin "$tag"
    
    echo -e "${GREEN}Deployment tag created: $tag${NC}"
}

# Function to show deployment history
show_deployment_history() {
    echo -e "${BLUE}=== Deployment History ===${NC}"
    
    if [ -f "$VERSION_FILE" ]; then
        jq -r '.changelog[] | "Build \(.build) (\(.date)): \(.version)"' "$VERSION_FILE" | tail -10
    else
        echo -e "${RED}No deployment history found${NC}"
    fi
}

# Main script logic
case "${1:-show}" in
    "increment")
        increment_build
        ;;
    "show")
        show_version
        ;;
    "deploy")
        increment_build
        new_build=$?
        update_deployment_status "railway" "deploying"
        update_deployment_status "vercel" "deploying"
        create_deployment_tag
        echo -e "${GREEN}Deployment initiated for build $new_build${NC}"
        ;;
    "status")
        check_deployment_status
        ;;
    "history")
        show_deployment_history
        ;;
    "add-changelog")
        shift
        if [ $# -eq 0 ]; then
            echo -e "${RED}Please provide changelog entries${NC}"
            echo "Usage: $0 add-changelog 'Change 1' 'Change 2' ..."
            exit 1
        fi
        add_changelog_entry "$@"
        ;;
    "update-deployment-status")
        if [ $# -lt 3 ]; then
            echo -e "${RED}Please provide platform and status${NC}"
            echo "Usage: $0 update-deployment-status <platform> <status>"
            exit 1
        fi
        update_deployment_status "$2" "$3"
        ;;
    "get-version")
        get_version_string
        ;;
    "create-deployment-tag")
        create_deployment_tag
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Usage: $0 [increment|show|deploy|status|history|add-changelog|update-deployment-status|get-version]"
        echo ""
        echo "Commands:"
        echo "  increment      - Increment build number"
        echo "  show          - Show current version info"
        echo "  deploy        - Increment build and create deployment tag"
        echo "  status        - Check deployment status"
        echo "  history       - Show deployment history"
        echo "  add-changelog - Add changelog entries"
        echo "  update-deployment-status - Update deployment status"
        echo "  get-version   - Get current version string"
        echo "  create-deployment-tag - Create git deployment tag"
        exit 1
        ;;
esac
