function IPCheck() {
    // Get the entered IP address from the input field
    var ipAddress = document.getElementById('ipBox').value;

    // Validate the IP address using a regular expression
    var ipMatch = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;

    if (!ipMatch.test(ipAddress)) {
        // Display that the IP is invalid.
        document.getElementById('ipOutput').innerHTML = "Invalid IP Address.";
        return;
    }

    var network = ipAnalysis(ipAddress);

    // Check if network is defined before accessing its properties
    if (network && network.ip) {
        document.getElementById("ipOutput").innerHTML = `
            <p>IP Address: ${network.ip}</p>
            <p>Subnet: ${network.subnet}</p>
            <p>IP Range (CIDR): ${network.ipRange}</p>
            <p>Broadcast Address: ${network.broadcast}</p>
            <p>Binary Equivalent: ${network.binary}</p>
        `;
    }
}

function ipAnalysis(ipAddress) {
    var ipParts = ipAddress.split(".");

    // Validate each octet of the IP address
    for (var i = 0; i < ipParts.length; i++) 
    {
        var octet = parseInt(ipParts[i], 10);
        if (isNaN(octet) || octet < 0 || octet > 255) 
        	{
    			document.getElementById('ipOutput').innerHTML = "Invalid IP Address.";
    			return;
			}
    }

    var binaryParts = ipParts.map(function (part) {
        return ("00000000" + parseInt(part, 10).toString(2)).slice(-8);
    });

    // Educated guess for the subnet mask
    var subnetMask;
    if (ipParts[0] >= 0 && ipParts[0] <= 127) {
        subnetMask = "255.0.0.0"; // Class A
    } else if (ipParts[0] >= 128 && ipParts[0] <= 191) {
        subnetMask = "255.255.0.0"; // Class B
    } else if (ipParts[0] >= 192 && ipParts[0] <= 223) {
        subnetMask = "255.255.255.0"; // Class C
    } else if (ipParts[0] >= 224 && ipParts[0] <= 239) {
        subnetMask = "N/A"; // Class D (No subnet mask)
    } else {
        subnetMask = "N/A"; // Class E and others (No subnet mask)
    }

    return {
        'ip': ipAddress,
        'subnet': subnetMask,
        'ipRange': ipAddress + (subnetMask !== "N/A" ? "/" + subnetMaskToCIDR(subnetMask) : ""),
        'broadcast': calculateBroadcast(ipAddress, subnetMask),
        'binary': binaryParts.join(".")
    };
}

// Function to calculate CIDR notation for IP range
function calculateCIDR(ipAddress, subnetMask) {
    // Convert IP address and subnet mask to arrays of integers
    var ipParts = ipAddress.split(".").map(Number);
    var maskParts = subnetMask.split(".").map(Number);

    // Validate IP address and subnet mask
    if (ipParts.length !== 4 || maskParts.length !== 4) {
        return "Invalid IP or Subnet Mask";
    }

    // Validate each octet of the IP address and subnet mask
    for (var i = 0; i < 4; i++) {
        if (isNaN(ipParts[i]) || isNaN(maskParts[i]) || ipParts[i] < 0 || ipParts[i] > 255 || maskParts[i] < 0 || maskParts[i] > 255) {
            return "Invalid IP or Subnet Mask";
        }
    }

    // Calculate CIDR notation
    var binaryIP = ipParts.map(part => ("00000000" + part.toString(2)).slice(-8)).join("");
    var binaryMask = maskParts.map(part => ("00000000" + part.toString(2)).slice(-8)).join("");

    // Find the position of the first '0' in the binary subnet mask
    var cidrNotation = binaryMask.indexOf('0');

    // Special handling for multicast addresses (Class D)
    if (ipParts[0] >= 224 && ipParts[0] <= 239) {
        return "/32";
    }

    // Special handling for broadcast address
    if (binaryIP === "11111111111111111111111111111111") {
        return "/32";
    }

    return "/" + (cidrNotation === -1 ? 32 : cidrNotation);
}

// Function to convert subnet mask to CIDR notation
function subnetMaskToCIDR(subnetMask) {
    if (subnetMask === "N/A") {
        return "/32"; // Default for unspecified subnet mask
    }

    // Use the new function to calculate CIDR notation
    return calculateCIDR("192.0.0.1", subnetMask);
}

// Calculate broadcast address based on IP address and subnet mask
function calculateBroadcast(ipAddress, subnetMask) {
    var ipParts = ipAddress.split(".");
    var maskParts = subnetMask.split(".");
    var broadcastParts = ipParts.map(function (part, index) {
        return parseInt(part, 10) | (~parseInt(maskParts[index], 10) & 255);
    });

    return broadcastParts.join(".");
}