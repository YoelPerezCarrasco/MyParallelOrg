// SimpleTable.tsx
import {
  Box,
  Table,
  styled,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Avatar,
  Typography
} from "@mui/material";

const StyledTable = styled(Table)(({ theme }) => ({
  whiteSpace: "pre",
  "& thead": {
    "& tr": { "& th": { paddingLeft: 0, paddingRight: 0 } }
  },
  "& tbody": {
    "& tr": { "& td": { paddingLeft: 0, textTransform: "capitalize" } }
  }
}));

interface SimpleTableProps {
  details: Array<{
    id: number;
    name: string;
    avatarUrl: string;
    commits: number;
    contributions: number;
    pullRequests: number;
    reviews: number;
    isLeader: boolean;
  }>;
}

export default function SimpleTable({ details }: SimpleTableProps) {
  return (
    <Box width="100%" overflow="auto">
      <StyledTable>
        <TableHead>
          <TableRow>
            <TableCell align="left">Avatar</TableCell>
            <TableCell align="left">Name</TableCell>
            <TableCell align="center">Commits</TableCell>
            <TableCell align="center">Contributions</TableCell>
            <TableCell align="center">Pull Requests</TableCell>
            <TableCell align="center">Reviews</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {details.map((detail) => (
            <TableRow key={detail.id}>
              <TableCell align="left">
                <Box display="flex" alignItems="center" position="relative">
                  <Avatar src={detail.avatarUrl} alt={detail.name} />
                  {detail.isLeader && (
                    <Box
                      position="absolute"
                      top={-5}
                      left={30}
                      bgcolor="gold"
                      borderRadius="100%"
                      width={20}
                      height={20}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Typography variant="caption" style={{ fontWeight: 'bold', color: 'black' }}>
                        Team Leader
                      </Typography>
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell align="left">{detail.name}</TableCell>
              <TableCell align="center">{detail.commits}</TableCell>
              <TableCell align="center">{detail.contributions}</TableCell>
              <TableCell align="center">{detail.pullRequests}</TableCell>
              <TableCell align="center">{detail.reviews}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </Box>
  );
}
