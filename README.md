# nexus-release
close and release nexus repo
# example
```yaml
- name: Nexus release
  uses: Propromp/nexus-release@1
  with:
    server: "s01.oss.sonatype.org" # Nexus server name (default:oss.sonatype.org)
    groupId: "com.example" # Group id of the repository
    nexusUsername: ${{ secrets.NEXUS_USERNAME }} # User name of the nexus repository manager
    nexusPassword: ${{ secrets.NEXUS_PASSWORD }} # Password of the nexus repository manager
```
